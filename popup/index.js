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
    var api_url = "http://api.wordnik.com:80/v4/word.json/"+word+"/definitions?limit=5&includeRelated=true&useCanonical=true&includeTags=false&api_key=409b7cc48186d3a77732a03dc040dd8e977137f44a87a0b8f";
    $.ajax({
        dataType: "json",
        url: api_url,
        success: function(result, status){
            var old_pos = ""; //pos = parts of speech 
            definitions = result
            root = document.createElement("p")
            root.setAttribute("style", "font-size:12px")
            td_elem.appendChild(root)
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
            $(root).parent().find("button").text(HIDEBUTTONTEXT)
        },
        error: function(result, status, error_thrown){
            if(result.status == 404)
                console.debug("Definition not found!")
            else
                console.debug("Unknown error, Code: " + result.status + ". Msg: " + error_thrown + status)
        }
    })
}

function getDeleteButton(){
    button_elem = document.createElement("button")
    button_elem.setAttribute("type", "button")
    button_elem.setAttribute("class", "btn btn-danger btn-sm")
    button_elem.setAttribute("style", "padding: 0px 4px")
    button_elem.innerHTML = "x"
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
        button_elem.setAttribute("class", "wordMeaning btn btn-outline-primary btn-sm")
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
    $(this).parent().parent().remove()
}
