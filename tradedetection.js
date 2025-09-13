const TradeOpen_Button = document.getElementById("TradeOpen_Button");
const TradeClose_Button = document.getElementById("TradeClose_Button");

const TradeEntryFrame = document.getElementById("TradeEntry")

const TradeEntryOpenFrame = document.getElementById("TradeOpen_Entry");
const TradeEntryCloseFrame = document.getElementById("TradeClose_Entry")

const EmotionButtons = document.getElementsByClassName("Emotion-Item")
const StrategyButtons = document.getElementsByClassName("Strategy-Item")
const TradeButtons = document.getElementById("Trade-Item")

const ContinueButton = document.getElementsByClassName("Continue-Button")
const CancelButtons = document.getElementsByClassName("Cancel-Button")

const PLText = document.getElementById("PL-Text")
const SymbolText = document.getElementById("Symbol-Text")
const TitleText = document.getElementById("Title-Text")

const NotesAreas = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_Frame_TextAreaFrame_TextArea")

const dropDownButtons = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_Button")
const dropDownList = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_List")

const entryList = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_List")

const imgInput = document.getElementById("img_Input")
const imgFrame = document.getElementById("img_Frame")

const fileInput = document.getElementById("fileInput")

const addButtons = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_Button")
const addInputFrames = document.getElementsByClassName("add-item")

const AIPromptFrame = document.getElementById("EntryAIPrompt")
const AIQuestionPromptFrame = document.getElementById("AIPromptQuestion")
const QuestionPromptButtons = document.getElementsByClassName("MainFrame_EntryAIPrompt_QuestionPrompt_ButtonDiv_Button")

const AIResponseFrame = document.getElementById("AIPromptResponse")
const AIResponseButton = document.getElementsByClassName("MainFrame_EntryAIPrompt_AIResponseFrame_Button")
const AIResponseText = document.getElementById("AIResponseText")

let currentEmotion = ""
let currentStrategy = ""
let currentSymbol = ""
let currentNotes = ""
let currentPL = ""
let currentTitle = ""
let tradeId = ""

let OpenEntry = false
let debounce = false

let tradeClientData

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getData(token) {
    const response = await fetch("https://get-accountdata-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })

    clientData = await response.json()
    console.log(clientData)

}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

async function log_Trade(token, tradeOpen) {

    let imgFile = ""
    if (fileInput.files.length > 0) {
        imgFile = await toBase64(fileInput.files[0])
    }


    const response = await fetch("https://log-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            trade_open: tradeOpen,
            trade_title: currentTitle,
            trade_id: tradeId,
            emotion: currentEmotion,
            strategy: currentStrategy,
            symbol: currentSymbol,
            trade_notes: currentNotes,
            PL: currentPL,
            img: imgFile 
        })
    });

    const worked = await response.text();
    return worked
}


TradeOpen_Button.addEventListener("click", async function() {
    if (!clientData) {
        await sleep(1500)
    }
    OpenEntry = true

    TradeOpen_Button.style.display = "none";
    TradeEntryFrame.style.display = "unset";
    TradeEntryCloseFrame.style.display = "none";
    TradeEntryOpenFrame.style.display = "block";
})

TradeClose_Button.addEventListener("click",  async function(){
    if (!clientData) {
        await sleep(1500)
    }
    OpenEntry = false

    TradeClose_Button.style.display = "none";
    TradeEntryFrame.style.display = "unset";
    TradeEntryOpenFrame.style.display = "none";
    TradeEntryCloseFrame.style.display = "block";
})


for (let i = 0; i < dropDownButtons.length; i++) {
    dropDownButtons[i].addEventListener("click", function(){
        if (dropDownList[i].style.display != "block") {
            dropDownList[i].style.display = "block"
            dropDownList[i].style.opacity = "1"
        } else {
            dropDownList[i].style.display = "none"
            dropDownList[i].style.opacity = "0"
        }
    })
}

async function resetEntry(refresh) {
    TradeClose_Button.style.display = "block";
    TradeOpen_Button.style.display = "block";
    TradeEntryFrame.style.display = "none";
    TradeEntryCloseFrame.style.display = "none";
    TradeEntryOpenFrame.style.display = "none";


    currentEmotion = ""
    currentStrategy = ""
    currentSymbol = ""
    currentNotes = ""
    currentPL = ""
    currentTitle = ""
    tradeId = ""
    OpenEntry = false

    for (let button = 0; button < dropDownButtons.length; button++) {
        if (dropDownButtons[button].getAttribute("buttontype") == "emotion") {
            dropDownButtons[button].innerHTML = "Emotion" + " &#8628"
        } else if (dropDownButtons[button].getAttribute("buttontype") == "trade") {
            dropDownButtons[button].innerHTML = "Trade" + " &#8628"
        } else if (dropDownButtons[button].getAttribute("buttontype") == "strategy") {
            dropDownButtons[button].innerHTML = "Strategy" + " &#8628"
        }
    }

    for (let i = 0; i < NotesAreas.length; i++) {
        NotesAreas[i].value = ""
    }

    SymbolText.value = ""
    TitleText.value = ""
    PLText.value = ""
    if (refresh == true) {
        location.reload();
    }
}

for (let i = 0; i < CancelButtons.length; i++) {
    CancelButtons[i].addEventListener("click", async function(){
        resetEntry(true)
    })
}


async function loadList() {
    for (let list = 0; list < entryList.length; list++) {
        if (entryList[list].getAttribute('listtype') == "emotion") {
            for (let i = 0; i < clientData['emotions'].length; i++) {
                let emotionItem = document.createElement("li")
                emotionItem.innerHTML = clientData['emotions'][i]
                emotionItem.classList.add("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_List_ListItem")
                emotionItem.classList.add("inter-text")
                emotionItem.classList.add("Emotion-Item")

                emotionItem.addEventListener("click", async function() {
                    for (let button = 0; button < dropDownButtons.length; button++) {
                        if (dropDownButtons[button].getAttribute("buttontype") == "emotion") {
                            dropDownButtons[button].innerHTML = clientData['emotions'][i] + " &#8628"
                        }
                    }
                    currentEmotion = clientData['emotions'][i]
                })

                entryList[list].appendChild(emotionItem)
            }
        } else if (entryList[list].getAttribute('listtype') == "strategy") {
            for (let i = 0; i < clientData['strategies'].length; i++) {
                let strategyItem = document.createElement("li")
                strategyItem.innerHTML = clientData['strategies'][i]
                strategyItem.classList.add("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_List_ListItem")
                strategyItem.classList.add("inter-text")
                strategyItem.classList.add("Emotion-Item")

                strategyItem.addEventListener("click", async function() {
                    for (let button = 0; button < dropDownButtons.length; button++) {
                        if (dropDownButtons[button].getAttribute("buttontype") == "strategy") {
                            dropDownButtons[button].innerHTML = clientData['strategies'][i] + " &#8628"
                        }
                    }
                    currentStrategy = clientData['strategies'][i]
                })

                entryList[list].appendChild(strategyItem)
            }
        } else if (entryList[list].getAttribute('listtype') == "trade") {
            console.log("Check")
            for (let i in clientData['trades']) {
                if (clientData['trades'][i]['open'] == false) {
                    continue
                }
                let tradeItem = document.createElement("li")
                tradeItem.innerHTML = clientData['trades'][i]['title']
                tradeItem.classList.add("MainFrame_TradeEntryFrame_TradeFrame_Frame_InputFrame_DropDownDiv_List_ListItem")
                tradeItem.classList.add("inter-text")
                tradeItem.classList.add("Trade-Item")

                tradeItem.addEventListener("click", async function() {
                    for (let button = 0; button < dropDownButtons.length; button++) {
                        if (dropDownButtons[button].getAttribute("buttontype") == "trade") {
                            dropDownButtons[button].innerHTML = clientData['trades'][i]['title'] + " &#8628"
                        }
                    }
                    tradeId = i
                })

                entryList[list].appendChild(tradeItem)
            }
        }
    }
}

fileInput.addEventListener("change", function() {
    const file = fileInput.files[0];
    if (!file) return;

    imgInput.style.display = "none"
    imgFrame.style.display = "block";
    imgFrame.src = URL.createObjectURL(file);
});

async function add_Emotion(token, emotionvalue) {
     const response = await fetch("https://add-emotion-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            emotion: emotionvalue,
        })
    });

    const worked = await response.text();
    console.log(worked);
}

async function add_Strategy(token, strategyValue) {
     const response = await fetch("https://add-strategy-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            strategy: strategyValue,
        })
    });

    const worked = await response.text();
    console.log(worked);
}

async function getTradeAI(token) {
    const response = await fetch("https://trade-airequest-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            trade_id: tradeId,
        })
    });

    return response.text();
}

async function AIResponsePrompt() {
    AIPromptFrame.style.display = "block";
    AIQuestionPromptFrame.style.display = "none";
    AIResponseFrame.style.display = "block";
    debounce = false;


    let loading = true;
    showLoadingAnimation(() => loading);


    let response = await getTradeAI(localStorage.getItem("token"));


    loading = false;

    console.log(response);
    if (response != "Invalid" && response != null) {
        AIResponseText.innerHTML = "";
        for (let i = 0; i < response.length; i++) {
            AIResponseText.innerHTML += response[i];
            await sleep(20);
        }
    }
    debounce = false
}


function showLoadingAnimation(isLoading) {
    let dots = 0;
    AIResponseText.innerHTML = "Generating"; 
    const interval = setInterval(() => {
        if (!isLoading()) {
            clearInterval(interval);
            return;
        }
        dots = (dots + 1) % 4;
        AIResponseText.innerHTML = "Generating" + ".".repeat(dots);
    }, 500);
}

async function AIPrompt() {
    AIPromptFrame.style.display = "block"
    AIQuestionPromptFrame.style.display = "block"
    console.log("Prompted")
}

for (let i = 0; i < QuestionPromptButtons.length; i++) {
    QuestionPromptButtons[i].addEventListener("click", async function() {
        if (tradeId != "" && debounce == false) {
            debounce = true
            if (i == 0) {
                AIResponsePrompt()
            } else if(i == 1) {
                AIPromptFrame.style.display = "none"
                resetEntry(true)
            }
        }
    })
}

AIResponseButton[0].addEventListener("click", async function () {
    resetEntry(true)
})



for (let i = 0; i < addButtons.length; i++){
    addButtons[i].addEventListener("click", async function() {
        if (addInputFrames[i].style.display == "unset") {
            if (addButtons[i].getAttribute("buttontype") == "emotion") {
                if (addInputFrames[i].value != "") {
                    await add_Emotion(localStorage.getItem("token"), addInputFrames[i].value)
                    location.reload();
                }
            } else if (addButtons[i].getAttribute("buttontype") == "strategy") {
                console.log("Check")
                if (addInputFrames[i].value != "") {
                    await add_Strategy(localStorage.getItem("token"), addInputFrames[i].value)
                    location.reload();
                }
            }
            addInputFrames[i].style.display = "none"
        } else {
            addInputFrames[i].style.display = "unset"
        }
    })
}

for (let i =0; i < ContinueButton.length; i++) {
    ContinueButton[i].addEventListener("click", async function() {
        if (debounce == true) {
            return
        }
        debounce = true
        if (OpenEntry == true) {
            currentSymbol = SymbolText.value
            currentNotes = NotesAreas[0].value
            currentTitle = TitleText.value
        } else {
            currentPL = PLText.value
            currentNotes = NotesAreas[1].value
        }

        TradeClose_Button.style.display = "block";
        TradeOpen_Button.style.display = "block";
        TradeEntryFrame.style.display = "none";
        TradeEntryCloseFrame.style.display = "none";
        TradeEntryOpenFrame.style.display = "none";

        let sucsess = await log_Trade(localStorage.getItem("token"), OpenEntry)
        if (sucsess != null) {
            if (OpenEntry == false) {
                AIPrompt()
            } else {
                location.reload()
            }
        } else {
            location.reload()
        }
        debounce = false
    })
}

async function init() {
    await sleep(2000)
    await loadList()
}

init()