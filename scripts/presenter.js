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
    div_tag = document.createElement("div")
    anchor_tag = document.createElement("a")
    div_tag.append(anchor_tag)
    $(anchor_tag).attr("href", "https://google.co.in/search?q=define "+selectedTextStr)
    $(anchor_tag).attr("target", "_blank")
    $(anchor_tag).text("Search on google")
    popupElem.appendChild(div_tag)
    div_tag = document.createElement("div")
    anchor_tag = document.createElement("a")
    div_tag.append(anchor_tag)
    $(anchor_tag).attr("href", "https://www.wordnik.com/words/"+selectedTextStr)
    $(anchor_tag).attr("target", "_blank")
    $(anchor_tag).text("Definition on Wordnik")
    popupElem.appendChild(div_tag)
    div_tag = document.createElement("div")
    power_tag = document.createElement("input")
    div_tag.append(power_tag)
    $(power_tag).attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAAASCAYAAACae3b5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABS1JREFUeNrsWM1u20YQXjpF0SPR9l7mCUIDuYt8AktPYOlkoBdLTyDzmJOoo1GgopMHEH0pil5EPUH4BlHuhc0gSpMGRtgZ4lt1tF5SsptDDXOABbnD3eHs/M8eqBZaEHDQiqAFCd+0Ing40Ol0+vTwlsvl2R32uPQY0ohpX0Fz3rui96SNEA8fjmmM77hniD1DzMeg00aIRwqp8WxTxgNIBQE/KYxnAudxesCUQ/xqBw2fHpweClqbazze8zvXEOfn52ZeSk5OTlb/Z0ESz5xTFfGZGPgF4cJ7KoeV8IZGRsIMjW8LelwSPjZy9DWU9rT85cc+JeKJckg5X1RM40I9UXOae6pUmbpRPefkzwK0AijLB60e/5fGhEbf+HcMhUsjWsDzPU0D35hGDzWDXhdKgzPqkhmmA1lDyNz0jMbrB+Bc0oskBPclCE9kAwvgddIDme6pJUczRGX8g6/+KmdqXbrqfanUh3KoPpYLmnvVfF0G6lM5M/YzXVb2iP6dQnmsJOYjYjyMZCiVLqALGfDaHgwkgFHtMv4hjKGAASVbKYO86kx4WUkjIFzGTxQi/ONLCKwShrGnS/NURh3+Tk8XBufjoFPC56DrwwDfYi0L4wgkLqX3W/hoih5ba4lOTDh+75s8s0D4nGL7BZTCyh8Apw3BI0F2oTxd6BWVItZWhbk75pHuGuCtPgyg8nCsienbzIwaAkKdJhAdgl1OIegVcv+BKUQMbfVaaWy1b1mRUBaHZCZ0jO9aAXMIXYfzDoxhIayY6SwI7wtLZlyKtDWGsnmMCTcRipsbfJw2nJkPvMRa5nOGFLjhWawzo0QGw+1zSkAa0V67MQ7dBrKDVMrjKLDP2AZpiNoRRsIYNE8DKO/WfqNmKJCGvAbZBDgPr3sq95tFpUwbPVY6CY9xI/YwXa0S7g0UHkE4mfAUxp8BP8XcxbsWwDN8Z+Xm2mM594OmFnwEhY3A20hEjIqPhkOHugaidfxP5jkCH0wrwxlyIzoo49994dURzqnTiW7fqrM5L66y8ufvC0sUkGBGtpUZPaSCDMgtnr/8Dyn3luGZKSOsydMmgxfAs5FM4HEsuEN4P693WXmiWB3XCKIwBHIkPEVBcb4IpSYfVpAFMQxbe02CyOMJo61r1yZYo6v3hAxhBaXMwFO61QF8IKMpa/P3iiSeWGqWW4VtTVfhfaXaSxvtnP4VSgPc52JqZSlm2DNWSBsJQjl3JbrFmQhlFVgb6oFvdTXAQKzjImkp6JrecdRQQ/ji3dX1i8Gza3YoRuhNoIRNhEM6yYVMtgzKubiKqXhMraniY9lzfr0q9ogek5oC8GsZRI7aiM/1Gqlv73uICLWBC0LHKMISIZAh1m3WI3ooCJXz9hxrA0SLw4Z/RSKqZDKEw7MzeG6TgDhSjUTOT0XUMHmug6noImIDzxEit7Vy6hMJ+2a7FSTXGzi/X+c7OhwuHlm+XbSlUzjUcUNBed9uiqNdjvpuRu8V7sBQhi30ZvDUnyBYzlmhEZp7WthYP4InKjxDRJox6BzC6zMZ9lFLTCGAU3QjI3xLBR9j8NGzpBElWrAOaDGdgSVsxnu0oOmmaBTC1N2SbZ/z2/U754/r5zfr8lW5Lt9dvf/ynIzh5Z66CnGmAI6l29DsLhdMexpFjv8VMIqJ8xhvBtG5uBYjqbuoKszii4vKmuKPZfotje/wfELjhsbfGJ/lzaI1wvz7vQtlVZ2E3IMLMd92i1mzLhcXVVu3mcat6KM0iE173EILLTTAPwIMAKzG4cHcgABwAAAAAElFTkSuQmCC")
    $(power_tag).attr("type", "image")
    popupElem.appendChild(div_tag)

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

