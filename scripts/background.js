if(navigator.userAgent.indexOf("Firefox") == -1) 
        browser = chrome

browser.runtime.onMessage.addListener(get_data_from_dictionary);

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
    return "http://api.wordnik.com:80/v4/word.json/"+word+"/"+endpoint+"?limit=5&includeRelated=true&useCanonical=true&includeTags=false&api_key=409b7cc48186d3a77732a03dc040dd8e977137f44a87a0b8f";
}

function save_data(word, result){
    if(!(word.length && result.length))
        return
    today_internal = new Date()
    today_str_internal = today.getFullYear().toString() + ( today.getMonth() + 1 ).toString() + today.getDate().toString()
    if(today_str_internal != today_str)
        today_str = today_str_internal
    words_list = new Set(JSON.parse(localStorage.getItem(today_str)))
    words_list.add(word)
    // Store words looked up today.
    localStorage.setItem(today_str, JSON.stringify(Array.from(words_list)))
    // // Store day on which word was looked up.
    // localStorage.setItem(word, today_str)
}

function get_data_from_dictionary(request){
    word = request.word
    url_offset = "/entries/en/"
    var api_url = getApiUrl("definitions", word)
    var pr_api_url = getApiUrl("pronunciations", word)
    var audio_url = getApiUrl("audio", word)
    console.debug("Searching the word " + word + " at " + api_url)
    audio = ""
    definitions = ""
    pronunciation = ""
    $.when(
        $.ajax({
            dataType: "json",
            url: api_url,
            success: function(result, status){
                definitions = result
            },
            error: function(result, status, error_thrown){
                if(result.status == 404)
                    console.debug("Definition not found!")
                else
                    console.debug("Unknown error, Code: " + result.status + ". Msg: " + error_thrown + status)
                definitions = ""
            }
        }),
        $.ajax({
            dataType: "json",
            url: pr_api_url,
            success: function(pronunciations, status){
                $.each(pronunciations, function(index, pronunciation_json){
                    if(pronunciation_json.rawType == "ahd-legacy")
                    {
                        pronunciation = pronunciation_json.raw.substr(1, pronunciation_json.raw.length-2)
                        return false;
                    }
                    else
                        pronunciation = pronunciation_json.raw

                })
            }
        }),
        $.ajax({
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
                }
                }
        })
    ).then(function(){
        result = {
            "audio": audio,
            "definitions": definitions,
            "pronunciation": pronunciation
        }
        send_data(result)
        save_data(word, definitions)
    })
}

