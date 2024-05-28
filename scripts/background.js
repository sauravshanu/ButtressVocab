importScripts('libs/pluralize.js')

const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
const browser = isFirefox ? browser : chrome;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  get_data_from_dictionary(request)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => console.error("Error:", error));
  return true; // Indicates that the response will be sent asynchronously
});

async function get_data_from_dictionary(request) {
  const word = pluralize.singular(request.word).toLowerCase();
  const api_url = getApiUrl("define", word);
  const audio_url = getApiUrl("audio", word);
  console.debug("Searching the word " + word + " at " + api_url);

  const existing_def = await getFromLocalStorage(word);
  if (existing_def && existing_def['audio']) {
    console.log("Found old entry for " + word);
    send_data(existing_def);
    return existing_def;
  }
  else {
    try {
      const [definitionResponse, audioResponse] = await Promise.all([
        fetch(api_url).then(response => response.json()),
        fetch(audio_url).then(response => response.json())
      ]);

      const definitions = definitionResponse;
      const result = {
        "audio": parseAudio(audioResponse),
        "definitions": parseDefinitions(definitions),
        "pronunciation": parsePronunciation(definitions),
        "word": word,
      };

      send_data(result);
      save_data(word, result);
      return result;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
}

function parseDefinitions(raw_definitions) {
    const definitions_list = [];
    const meanings = raw_definitions[0]?.meanings;

    if (!Array.isArray(meanings)) {
        console.error("Expected meanings to be an array, got:", meanings);
        return definitions_list;
    }

    meanings.forEach(({ partOfSpeech, definitions }) => {
        if (Array.isArray(definitions)) {
            definitions.forEach(defn => {
                definitions_list.push({
                    "partOfSpeech": partOfSpeech,
                    "text": defn.definition,
                    "example": defn.example,
                    "synonyms": defn.synonyms
                });
            });
        } else {
            console.error("Expected definitions to be an array, got:", definitions);
        }
    });

    return definitions_list;
}


function parsePronunciation(raw_definitions) {
  return raw_definitions[0].phonetics[0].text;
}

function parseAudio(raw_definitions) {
  return raw_definitions[0].fileUrl
}

async function send_data(result) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { response: result });
}

async function save_data(word, result) {
  if (!(word.length && result.definitions.length)) return;

  const today = new Date();
  const today_str = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
  const storedWords = await getFromLocalStorage(today_str);
  const words_list = new Set(storedWords || []);
  words_list.add(word);

  await chrome.storage.sync.set({
    [today_str]: Array.from(words_list),
    [word]: result
  });
}

function getApiUrl(endpoint, word) {
  if (endpoint === "audio")
    return `http://api.wordnik.com:80/v4/word.json/${word}/${endpoint}?limit=5&includeRelated=true&useCanonical=true&includeTags=false&api_key=409b7cc48186d3a77732a03dc040dd8e977137f44a87a0b8f`;
  return `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
}

async function getFromLocalStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}
