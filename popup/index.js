const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getCurrentLocalDate(){
    return new Date()
}

todayDate = getCurrentLocalDate()
currentDate = getCurrentLocalDate()

SHOWBUTTONTEXT = "I don't remember. Show me!"
HIDEBUTTONTEXT = "I recalled. Hide it!"

function getMeaning(word, td_elem){
    var api_url = getApiUrl("definitions", word)
    var pr_api_url = getApiUrl("pronunciations", word)
    var audio_url = getApiUrl("audio", word)
    audio = ""
    definitions = ""
    pronunciation = ""
    existing_def = localStorage.getItem(word)
    if(existing_def) 
        renderMeaning(JSON.parse(existing_def), td_elem)
    else
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
                "pronunciation": pronunciation,
                "definitions": definitions
            }
            renderMeaning(result, td_elem)
        })
}

function getDeleteButton(){
    button_elem = document.createElement("div")
    img_elem = document.createElement("img")
    img_elem.setAttribute("src", "dustin.png")
    $( img_elem ).css("cursor", "pointer")
    button_elem.appendChild(img_elem)
    // button_elem.setAttribute("style", "padding: 0px 4px")
    button_elem.addEventListener("click", deleteRow)
    return button_elem
}

function populate(offset){
    if(offset == 0)
        currentDate = getCurrentLocalDate()
    else
        currentDate.setDate(currentDate.getDate() + offset)
    if(todayDate.toDateString() == currentDate.toDateString())
        $("#today").text("Today")
    else{
        $("#today").text(currentDate.getDate() + " " + monthNames[currentDate.getMonth()])
    }
    currentDateStr = currentDate.getFullYear().toString() + ( currentDate.getMonth() + 1  ).toString() + currentDate.getDate().toString();
    words = JSON.parse(localStorage.getItem(currentDateStr));
    word_container = document.getElementById("words-table");
    word_container.innerHTML = ""
    for(i in words){
        tr_elem = document.createElement("tr")
        word_container.appendChild(tr_elem);

        td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem)
        td_elem.innerHTML = words[i]

        td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem)
        button_elem = document.createElement("button")
        button_elem.setAttribute("class", "wordMeaning btn btn-outline-dark btn-sm")
        // button_elem.setAttribute("class", "wordMeaning")
        td_elem.appendChild(button_elem)
        td_elem.setAttribute("id", words[i])
        button_elem.innerHTML = SHOWBUTTONTEXT
        button_elem.addEventListener("click", showMeaning)
        // td_elem.setAttribute("style", "height: 39px;overflow-y: hidden;position: absolute;")
        // definitions = getMeaning(words[i], td_elem)
        td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem)
        td_elem.setAttribute("id", words[i])
        td_elem.appendChild(getDeleteButton())
    }
}
populate(0)

$("#today").click(function(){
    populate(0)
})

$("#backward").click(function(){
    populate(-1)
})

$("#forward").click(function(){
    populate(1)
})

function showMeaning(){
    current = this
    if($(current).text() == SHOWBUTTONTEXT){
        $(current).css("pointer-events", "none");
        getMeaning($(current).parent().attr("id"), $(current).parent()[0])
    }
    else{
        $(current).parent().find("p").remove()
        $(current).text(SHOWBUTTONTEXT)
    }
}

function deleteRow(){
    currentDateStr = currentDate.getFullYear().toString() + ( currentDate.getMonth() + 1  ).toString() + currentDate.getDate().toString();
    words = JSON.parse(localStorage.getItem(currentDateStr));
    word = $(this).parent().attr("id")
    var index = words.indexOf(word);
    if (index > -1) {
        words.splice(index, 1);
    }
    localStorage.setItem(currentDateStr, JSON.stringify(words))
    localStorage.removeItem(word)
    $(this).parent().parent().remove()
}

function playAudio(){
    $(this).find("audio")[0].load();
    $(this).find("audio")[0].play();
}

function renderMeaning(result, td_elem){
    audio = result.audio
    definitions = result.definitions
    pronunciation = result.pronunciation
    var old_pos = ""; //pos = parts of speech
    root = document.createElement("p")
    root.setAttribute("style", "font-size:12px")
    td_elem.appendChild(root)

    elem = document.createElement("span")
    root.appendChild(elem)
    $(elem).html(" "+pronunciation)

    if(audio.length){
        elem = document.createElement("span")
        elem.addEventListener("click", playAudio)
        elem.innerHTML = ' <input src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAi0lEQVQokWNgQAYyQFzGsI JBnwED8DNcBpK+DM8YfjMUokqxMRxg+A9m8TJsBLLSEFKMDCuBAv/hCncxfGWQhUn2gaVAktkMXkBSHmh0OwNU8D9csoHhO4MikN7BcAGb5H+GYiDdCTQYq2QubkkkY/E6C LtXdiJ7BTMQMnAHXxFm6IICvhwY8AYQLgCw2U9d90B8BAAAAABJRU5ErkJggg==" width="14" type="image" height="14"><audio src="'+audio+'" "preloa d="auto"></audio> '
        root.appendChild(elem)
    }
    root.appendChild(document.createElement("br"))
    definitions.forEach((defn, index)=> {
        if(old_pos != defn.partOfSpeech)
        {
            old_pos = defn.partOfSpeech
            elem = document.createElement("b")
            root.appendChild(elem)
            $(elem).text(defn.partOfSpeech)
        }
        elem = document.createElement("div")
        root.appendChild(elem)
        $(elem).text(index+1+": "+defn.text)
    })
    $(td_elem).find("button").css("pointer-events", "auto");
    $(root).parent().find("button").text(HIDEBUTTONTEXT)
}
