if(navigator.userAgent.indexOf("Firefox") == -1)
    browser = chrome

$(document).dblclick(function(){
    dblclickSlection();
});

var selectedText;
function dblclickSlection(){
    flag = 0;
    if (window.getSelection) {
        selectedText = window.getSelection();
    } else if (document.getSelection) {
        selectedText = document.getSelection();
    } else if (document.selection) {
        selectedText = document.selection.createRange().text;
    }
    if(selectedText.toString().length > 1)
        browser.runtime.sendMessage({"word": selectedText.toString()})
}

browser.runtime.onMessage.addListener(function(msg){
    selectedTextStr = selectedText.toString()
    console.log("selected text is "+selectedTextStr)
    console.log(msg)
    definitions = msg.response.definitions
    pronunciation = msg.response.pronunciation
    audio = msg.response.audio
    var selectedRange = selectedText.getRangeAt(0);
    var selectedRect = selectedRange.getBoundingClientRect();
    var dictBoxPadding = 10;
    var dictBoxMaxWidth = 350;
    var popupElem;
    var dictBoxLeftOffset;
    var pageWidth;

    popupElem = document.getElementById("popupElem");
    
    
    // No need to reconstruct the Pop up Element if it is already there.
    // It happens when a word from the popup element is looked up.
    if(!popupElem) {
        // Construct Popup box.
        popupElem = document.createElement('p');
        popupElem.id = "popupElem";
        document.body.appendChild(popupElem);

        popupElem.style.boxShadow = "5px 5px 5px #888888";
        popupElem.style.position = 'absolute'; 
        // Always appear on top.
        popupElem.style.zIndex = "3000"; 
        popupElem.style.top = selectedRect.top - popupElem.style.height+window.scrollY + 'px';
        popupElem.style.backgroundColor = "#ffffff";
        popupElem.style.padding = dictBoxPadding + "px";
        popupElem.style.fontFamily = "Segoe UI";
        popupElem.style.fontSize = "14px";
        popupElem.style.borderRadius = "0px 5px 5px 5px";
        popupElem.style.maxWidth = dictBoxMaxWidth + "px";
    
        dictBoxLeftOffset = selectedRect.left + selectedRect.width + window.scrollX + 1;
        pageWidth = $(window).width();
        if ( (dictBoxMaxWidth + dictBoxLeftOffset ) > (pageWidth - dictBoxPadding)) {
            dictBoxLeftOffset = pageWidth - dictBoxMaxWidth - dictBoxPadding;
        }
        popupElem.style.left = dictBoxLeftOffset + 'px';
    }
    // Clear the data from previously searched word.
    else
        $(popupElem).html("")

    // If no definition found.
    if (!definitions.length) {
        elem = document.createElement("p")
        $(elem).text("Definition not found!")
        popupElem.appendChild(elem)
        anchor_tag = document.createElement("a")
        $(anchor_tag).attr("href", "https://google.co.in/search?q="+selectedTextStr)
        $(anchor_tag).attr("target", "_blank")
        $(anchor_tag).text("Search on google")
        popupElem.appendChild(anchor_tag)
        return;
    }

    // This could have been else block of previous if.
    // Fill the box with the definition of the word.
    var elem = document.createElement("b")
    $(elem ).text(selectedTextStr)
    popupElem.appendChild(elem)
    elem = document.createElement("span")
    popupElem.appendChild(elem)
    $(elem).html(" "+pronunciation)
    if(audio.length){
        elem = document.createElement("span")
        elem.addEventListener("click", playAudio)
        elem.innerHTML = ' <input src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAi0lEQVQokWNgQAYyQFzGsIJBnwED8DNcBpK+DM8YfjMUokqxMRxg+A9m8TJsBLLSEFKMDCuBAv/hCncxfGWQhUn2gaVAktkMXkBSHmh0OwNU8D9csoHhO4MikN7BcAGb5H+GYiDdCTQYq2QubkkkY/E6CLtXdiJ7BTMQMnAHXxFm6IICvhwY8AYQLgCw2U9d90B8BAAAAABJRU5ErkJggg==" width="14" type="image" height="14"><audio src="'+audio+'" "preload="auto"></audio>'
        popupElem.appendChild(elem)
    }
    popupElem.appendChild(document.createElement("br"))
    var old_pos = ""; //pos = parts of speech
    definitions.forEach((defn, index)=> {
        if(old_pos != defn.partOfSpeech)
        {
            old_pos = defn.partOfSpeech
            elem = document.createElement("b")
            popupElem.appendChild(elem)
            $(elem).text(defn.partOfSpeech)
        }
        elem = document.createElement("div")
        popupElem.appendChild(elem)
        $(elem).text(index+1+": "+defn.text)
    })
    anchor_tag = document.createElement("a")
    $(anchor_tag).attr("href", "https://google.co.in/search?q=define "+selectedTextStr)
    $(anchor_tag).attr("target", "_blank")
    $(anchor_tag).text("Search on google")
    popupElem.appendChild(anchor_tag)

});

$(document).click(function(event){
    if(document.getElementById("popupElem"))
        if(!document.getElementById("popupElem").contains(event.target))
            $("#popupElem").remove();
});

function playAudio(){
    $(this).find("audio")[0].load();
    $(this).find("audio")[0].play();
}

