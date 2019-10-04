if(navigator.userAgent.indexOf("Firefox") == -1) 
        browser = chrome

browser.runtime.onMessage.addListener(get_data_from_dictionary);

function parseDefinitions(raw_definitions){
    definitions_list = [];
    Object.entries(raw_definitions[0].meaning).forEach(
        // Below lines of code are only for legacy support.
        // partsOfSpeech shouldn't be added to all the elements.
        // Until clients database is cleared,
        // this schema has to be retained.
        ([partOfSpeech, definitions])=>{
            definitions.forEach((defn, index)=>{
                definitions_list.push({
                    "partOfSpeech": partOfSpeech,
                    "text": defn.definition,
                    "example": defn.example,
                    "synonyms": defn.synonyms
                })
            })
    })
    return definitions_list
}

function parsePronunciation(raw_definitions){
    return raw_definitions[0].phonetic;
}

function send_data(result){
    browser.tabs.query({
        currentWindow: true,
        active: true
    }, function(tabs){
        browser.tabs.sendMessage(
            tabs[0].id,
            {response: result});
    })
}

today = new Date()
today_str = today.getFullYear().toString() + ( today.getMonth() + 1 ).toString() + today.getDate().toString()
words_list = new Set(JSON.parse(localStorage.getItem(today_str)));

function getApiUrl(endpoint, word){
    if(endpoint=="audio")
        return "http://api.wordnik.com:80/v4/word.json/"+word+"/"+endpoint+"?limit=5&includeRelated=true&useCanonical=true&includeTags=false&api_key=409b7cc48186d3a77732a03dc040dd8e977137f44a87a0b8f";
    return "https://googledictionaryapi.eu-gb.mybluemix.net/?"+endpoint+"="+word;
}

function save_data(word, result){
    if(!(word.length && result.definitions.length))
        return
    today_internal = new Date()
    today_str_internal = today_internal.getFullYear().toString() + ( today_internal.getMonth() + 1 ).toString() + today_internal.getDate().toString()
    if(today_str_internal != today_str)
        today_str = today_str_internal
    words_list = new Set(JSON.parse(localStorage.getItem(today_str)))
    words_list.add(word)
    // Store words looked up today.
    localStorage.setItem(today_str, JSON.stringify(Array.from(words_list)))
    // Store day on which word was looked up.
    localStorage.setItem(word, JSON.stringify(result))
}

function get_data_from_dictionary(request){
    word = request.word
    var api_url = getApiUrl("define", word)
    // var pr_api_url = getApiUrl("pronunciations", word)
    var audio_url = getApiUrl("audio", word)
    console.debug("Searching the word " + word + " at " + api_url)
    audio = ""
    definitions = ""
    pronunciation = ""
    existing_def = localStorage.getItem(word)
    if(existing_def){
        console.log("Found old entry for "+word);
        send_data(JSON.parse(existing_def))
        return
    }
    $.when(
        $.ajax({
            dataType: "json",
            url: api_url,
            success: function(result, status){
                definitions = result
            },
            error: function(result, status, error_thrown){
                if(result.status == 404)
                    console.log("Definition not found!")
                else
                    console.log("Unknown error, Code: " + result.status + ". Msg: " + error_thrown + status)
                definitions = ""
            }
        }),
        $.ajax({
            //TODO
            //Fix this section ASAP.
            dataType: "json",
            url: audio_url,
            success: function(audio_json, status){
                try
                {
                    audio = audio_json[0].fileUrl
                }
                catch(ex)
                {
                    console.error("something is wrong" +ex)
                }},
            error: function(result, status, error_thrown){
                if(result.status == 404)
                    console.log("Audio file not found");
                audio = "";
            }
        })
    ).then(function(){
        result = {
            "audio": audio,
            "definitions": parseDefinitions(definitions),
            "pronunciation": parsePronunciation(definitions)
        }
        send_data(result)
        save_data(word, result)
    },
    function(){
        // There might be a better way to write this but I'm lazy.
        $.ajax({
            dataType: "json",
            url: api_url,
            success: function(result, status){
                definitions = result
                result = {
                    "audio": "",
                    "definitions": parseDefinitions(definitions),
                    "pronunciation": parsePronunciation(definitions)
                }
                send_data(result)
                save_data(word, result)
            },
            error: function(result, status, error_thrown){
                if(result.status == 404)
                    console.log("Definition not found!")
                else
                    console.log("Unknown error, Code: " + result.status + ". Msg: " + error_thrown + status)
                definitions = ""
            }
    })
    })
}

