const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getCurrentLocalDate() {
    return new Date();
}

const todayDate = getCurrentLocalDate();
let currentDate = getCurrentLocalDate();

const SHOWBUTTONTEXT = "I don't remember. Show me!";
const HIDEBUTTONTEXT = "I recalled. Hide it!";

function getApiUrl(endpoint, word) {
    if (endpoint === "audio")
        return `http://api.wordnik.com:80/v4/word.json/${word}/${endpoint}?limit=5&includeRelated=true&useCanonical=true&includeTags=false&api_key=409b7cc48186d3a77732a03dc040dd8e977137f44a87a0b8f`;
    return `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
}


function getMeaning(word, td_elem) {
    const api_url = getApiUrl("define", word);
    const audio_url = getApiUrl("audio", word);
    let audio = "";
    let definitions = "";
    let pronunciation = "";

    chrome.storage.sync.get([word], function(result) {
        const existing_def = result[word];
        if (existing_def) {
            renderMeaning(existing_def, td_elem);
        } else {
            chrome.runtime.sendMessage({
                action: "get_data_from_dictionary",
                word: word
            }, function (response) {
                if (response) {
                    renderMeaning(response, td_elem);
                } else {
                    console.error('No response from background script');
                }
            });
        }
    });
}

function getDeleteButton() {
    const button_elem = document.createElement("div");
    const img_elem = document.createElement("img");
    img_elem.setAttribute("src", "../popup/dustin.png");
    $(img_elem).css("cursor", "pointer");
    button_elem.appendChild(img_elem);
    button_elem.addEventListener("click", deleteRow);
    return button_elem;
}

function populate_by_date(offset) {
    if (offset === 0)
        currentDate = getCurrentLocalDate();
    else
        currentDate.setDate(currentDate.getDate() + offset);
    if (todayDate.toDateString() === currentDate.toDateString())
        $("#today").text("Today");
    else {
        $("#today").text(`${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`);
    }
    const currentDateStr = `${currentDate.getFullYear()}${currentDate.getMonth() + 1}${currentDate.getDate()}`;
    chrome.storage.sync.get([currentDateStr], function(result) {
        const words = result[currentDateStr] || [];
        populate(words);
    });
}

function populate(words) {
    const word_container = document.getElementById("words-table");
    word_container.innerHTML = "";
    words.forEach(word => {
        const tr_elem = document.createElement("tr");
        word_container.appendChild(tr_elem);

        let td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem);
        td_elem.innerHTML = word;

        td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem);
        const button_elem = document.createElement("button");
        button_elem.setAttribute("class", "wordMeaning btn btn-outline-dark btn-sm");
        td_elem.appendChild(button_elem);
        td_elem.setAttribute("id", word);
        button_elem.innerHTML = SHOWBUTTONTEXT;
        button_elem.addEventListener("click", showMeaning);

        td_elem = document.createElement("td");
        tr_elem.appendChild(td_elem);
        td_elem.setAttribute("id", word);
        td_elem.appendChild(getDeleteButton());
    });
}

populate_by_date(0);

$("#today").click(function() {
    populate_by_date(0);
});

$("#backward").click(function() {
    populate_by_date(-1);
});

$("#forward").click(function() {
    populate_by_date(1);
});

$("#all").click(function() {
    populate_count(0);
});

$("#populate10").click(function() {
    populate_count(10);
});

$("#populate50").click(function() {
    populate_count(50);
});

$("#populate100").click(function() {
    populate_count(100);
});

$("#populate500").click(function() {
    populate_count(500);
});

function populate_count(count) {
    chrome.storage.sync.get(null, function(items) {
        const words_to_send = [];
        const words = Object.keys(items);
        let i = count;
        const len = words.length;
        if (i > len || i === 0)
            i = words.length;
        while (i--) {
            if (isNaN(words[i])) {
                words_to_send.push(words[i]);
            }
        }
        populate(words_to_send);
    });
}

function showMeaning() {
    const current = this;
    if ($(current).text() === SHOWBUTTONTEXT) {
        $(current).css("pointer-events", "none");
        getMeaning($(current).parent().attr("id"), $(current).parent()[0]);
    } else {
        $(current).parent().find("p").remove();
        $(current).text(SHOWBUTTONTEXT);
    }
}

function deleteRow() {
    const currentDateStr = `${currentDate.getFullYear()}${currentDate.getMonth() + 1}${currentDate.getDate()}`;
    chrome.storage.sync.get([currentDateStr], function (data) {
        let words = data[currentDateStr] || [];
        const word = $(this).parent().attr("id");
        const index = words.indexOf(word);
        if (index > -1) {
            words.splice(index, 1);
        }
        chrome.storage.sync.set({ [currentDateStr]: words });
        chrome.storage.sync.remove(word, function () {
            if (chrome.runtime.lastError) {
                console.error("Error removing word:", chrome.runtime.lastError);
            }
        });
        $(this).parent().parent().remove();
    }.bind(this));
}


function playAudio() {
    const audioElement = $(this).find("audio")[0];
    audioElement.load();
    audioElement.play();
}

function renderMeaning(result, td_elem) {
    const { audio, definitions, pronunciation } = result;
    const root = document.createElement("p");
    root.setAttribute("style", "font-size:12px");
    td_elem.appendChild(root);

    let elem = document.createElement("span");
    root.appendChild(elem);
    $(elem).html(` ${pronunciation}`);

    if (audio.length) {
        elem = document.createElement("span");
        elem.addEventListener("click", playAudio);
        elem.innerHTML = ' <input src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAi0lEQVQokWNgQAYyQFzGsI JBnwED8DNcBpK+DM8YfjMUokqxMRxg+A9m8TJsBLLSEFKMDCuBAv/hCncxfGWQhUn2gaVAktkMXkBSHmh0OwNU8D9csoHhO4MikN7BcAGb5H+GYiDdCTQYq2QubkkkY/E6C LtXdiJ7BTMQMnAHXxFm6IICvhwY8AYQLgCw2U9d90B8BAAAAABJRU5ErkJggg==" width="14" type="image" height="14"><audio src="' + audio + '" preload="auto"></audio> ';
        root.appendChild(elem);
    }

    root.appendChild(document.createElement("br"));
    let old_pos = ""; // pos = parts of speech
    definitions.forEach((defn, index) => {
        if (old_pos !== defn.partOfSpeech) {
            old_pos = defn.partOfSpeech;
            elem = document.createElement("b");
            root.appendChild(elem);
            $(elem).text(defn.partOfSpeech);
        }
        elem = document.createElement("div");
        const meaning = document.createElement("div");
        elem.appendChild(meaning);
        if (defn.example) {
            const example = document.createElement("div");
            $(example).text(`"${defn.example}"`);
            elem.appendChild(example);
            example.setAttribute("style", "color: #878787 !important;");
        }
        $(meaning).text(`${index + 1}: ${defn.text}`);
        root.appendChild(elem);
    });

    $(td_elem).find("button").css("pointer-events", "auto");
    $(root).parent().find("button").text(HIDEBUTTONTEXT);
}


$('#export').click(function() {
    exportToExcel();
});

// Function to export data to an Excel sheet
function exportToExcel() {

    chrome.storage.sync.get(null, function(items) {
        const words = Object.keys(items).filter(key => isNaN(key) || isNaN(parseFloat(key)));

        const data = words.map(word => ({
            Word: word,
            Meaning: JSON.stringify(items[word].definitions)
        }));

        // Create a new workbook and add a worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Words");

        // Create an Excel file and trigger a download
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'words.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
