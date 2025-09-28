const EntryButton = document.getElementById("TradeOpen_Button")
const TradeEntryFrame = document.getElementById("TradeEntry")

const TradeContinueButton = document.getElementById("Continue_button");
const TradeClose_Button = document.getElementById("Cancel_button");


const emotionedit = document.getElementById("emotion-edit")
const strategyedit = document.getElementById("strategy-edit")
const managerListFrames = document.getElementsByClassName("MainFrame_ManageFrame_div_div_listframe")
const managerFrame = document.getElementById("manage-frame")
const emotionManager = document.getElementById("Emotion-Manage")
const strategyManager = document.getElementById("Strategy-Manage")


const TradeEntryOpenFrame = document.getElementById("TradeOpen_Entry");
const TradeEntryCloseFrame = document.getElementById("TradeClose_Entry")

const EmotionButtons = document.getElementsByClassName("Emotion-Item")
const StrategyButtons = document.getElementsByClassName("Strategy-Item")
const TradeButtons = document.getElementById("Trade-Item")

const ContinueButton = document.getElementsByClassName("Continue-Button")
const CancelButtons = document.getElementsByClassName("Cancel-Button")

const PLText = document.getElementById("PL-Text")
const SymbolText = document.getElementById("Symbol-Text")
const NotesText = document.getElementById("Notes-Text")

const tradedropDownButtons = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_div_dropdownbutton")
const dropDownButtonText = document.getElementsByClassName("select-text")

const ManagerClosebuttons = document.getElementsByClassName("MainFrame_ManageFrame_div_bottomdiv_button");

const entryList = document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_div_dropdown")

const imgInput = document.getElementById("img_Input")
const imgFrame = document.getElementById("img_Frame")

const fileInput = document.getElementById("tradeImageInput")

const promptFrame = document.getElementById("PromptFrame")
const continuePrompt = document.getElementById("Continue_prompt")
const closePrompt = document.getElementById("Close_prompt")


let tradeLogged = false
let tradeEntry = {
    ['id']: "",
    ['emotion']: "",
    ['strategy']: "",
    ['symbol']: "",
    ['notes']: "",
    ['pl']: "",
    ['img']: ""
}

let debounce = false

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function log_Trade(token) {
    const response = await fetch("https://log-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            emotion: tradeEntry['emotion'],
            strategy: tradeEntry['strategy'],
            symbol: tradeEntry['symbol'],
            trade_notes: tradeEntry['notes'],
            PL: tradeEntry['pl'],
            img: tradeEntry['img'] 
        })
    });

    return await response.text()
}

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


TradeContinueButton.addEventListener("click", async function() {
    if (Number(PLText.value) != null) {
        tradeEntry['pl'] = Number(PLText.value)
    }
    tradeEntry['symbol'] = SymbolText.value
    tradeEntry['notes'] = NotesText.value
    tradeEntry['id'] = await log_Trade(localStorage.getItem("token"))
    tradeLogged = true
    promptFrame.style.display = "block"
})

continuePrompt.addEventListener("click", async function(params) {
    if (tradeLogged && tradeEntry['id'] != null) {
        localStorage.setItem("handoff", tradeEntry['id'])
        location.href = "../Chat/chat.html"
    } else {
        location.reload()
    }
})

closePrompt.addEventListener("click", async function(params) {
    location.reload()
})

TradeClose_Button.addEventListener("click",  async function(){
    location.reload()
})



function loadList() {
    for (let emotion in clientData['emotions']) {
        let li = document.createElement("li")
        li.innerHTML = emotion
        li.classList.add("MainFrame_TradeEntryFrame_TradeFrame_div_dropdown_text")
        li.classList.add("inter-text")

        li.addEventListener("click", async function(){
            tradeEntry['emotion'] = emotion
            dropDownButtonText[0].textContent  = emotion
        })

        entryList[0].appendChild(li)
    }

    for (let strategy in clientData['strategies']) {
        console.log(strategy)
        let li = document.createElement("li")
        li.innerHTML = strategy
        li.classList.add("MainFrame_TradeEntryFrame_TradeFrame_div_dropdown_text")
        li.classList.add("inter-text")

        li.addEventListener("click", async function(){
            tradeEntry['strategy'] = strategy
            dropDownButtonText[1].textContent  = strategy
        })
       entryList[1].appendChild(li)
    }
}

async function addEmotionFrames(emotion) {
    let listNode = document.createElement("div")
    listNode.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem")

    let listTitle = document.createElement("p")
    listTitle.classList.add("inter-text")
    listTitle.innerHTML = emotion
    listTitle.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_title")

    let listButton = document.createElement("button")
    listButton.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_button")
    listTitle.classList.add("inter-text")
    listButton.innerHTML = "Delete"

    listButton.addEventListener("click", async function (params) {
        const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                emotion: emotion,
            })
        })
        listNode.remove()
    })

    listNode.appendChild(listTitle)
    listNode.appendChild(listButton)
    
    managerListFrames[0].appendChild(listNode)

    let li = document.createElement("li")
    li.innerHTML = emotion
    li.classList.add("MainFrame_TradeEntryView_TradeFrame_div_dropdown_text")
    li.classList.add("inter-text")

    li.addEventListener("click", async function(){
        entryEmotion = emotion
        entryView.querySelector(".select-text-emotion").textContent  = emotion
    })

    entryViewList[1].appendChild(li)
}

async function addStrategyFrame(strategy) {
    let listNode = document.createElement("div")
    listNode.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem")

    let listTitle = document.createElement("p")
    listTitle.classList.add("inter-text")
    listTitle.innerHTML = strategy
    listTitle.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_title")

    let listButton = document.createElement("button")
    listButton.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_button")
    listTitle.classList.add("inter-text")
    listButton.innerHTML = "Delete"

    listButton.addEventListener("click", async function (params) {
        const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                strategy: strategy,
            })
        })
        listNode.remove()
    })

    listNode.appendChild(listTitle)
    listNode.appendChild(listButton)
    
    managerListFrames[1].appendChild(listNode)

    let li = document.createElement("li")
    li.innerHTML = strategy
    li.classList.add("MainFrame_TradeEntryView_TradeFrame_div_dropdown_text")
    li.classList.add("inter-text")

    li.addEventListener("click", async function(){
        entryStrategy = strategy
        entryView.querySelector(".select-text-strategy").textContent  = strategy
    })

    entryViewList[1].appendChild(li)
}

async function loadManager(params) {
    console.log("Check")
    for (let emotion in clientData.emotions) {
        let listNode = document.createElement("div")
        listNode.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem")

        let listTitle = document.createElement("p")
        listTitle.classList.add("inter-text")
        listTitle.innerHTML = emotion
        listTitle.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_title")

        let listButton = document.createElement("button")
        listButton.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_button")
        listTitle.classList.add("inter-text")
        listButton.innerHTML = "Delete"

        listButton.addEventListener("click", async function (params) {
            const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    emotion: emotion,
                })
            })
            console.log(await response.text())
            listNode.remove()
        })

        listNode.appendChild(listTitle)
        listNode.appendChild(listButton)
        
        managerListFrames[0].appendChild(listNode)
    }   

    for (let strategy in clientData.strategies) {
        let listNode = document.createElement("div")
        listNode.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem")

        let listTitle = document.createElement("p")
        listTitle.classList.add("inter-text")
        listTitle.innerHTML = strategy
        listTitle.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_title")

        let listButton = document.createElement("button")
        listButton.classList.add("MainFrame_ManageFrame_div_div_listframe_listitem_button")
        listTitle.classList.add("inter-text")
        listButton.innerHTML = "Delete"

        listButton.addEventListener("click", async function (params) {
            const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    strategy: strategy
                })
            })
            listNode.remove()
        })

        listNode.appendChild(listTitle)
        listNode.appendChild(listButton)
        
        managerListFrames[1].appendChild(listNode)
    }   

    emotionManager.querySelector(".MainFrame_ManageFrame_div_div_button").addEventListener("click", async function() {
        const response = await fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                emotion_Title: emotionManager.querySelector(".MainFrame_ManageFrame_div_div_input").value,
                emotion_Description: emotionManager.querySelector(".MainFrame_ManageFrame_div_div_textarea").value,
            })
        })
        
        addEmotionFrames(emotionManager.querySelector(".MainFrame_ManageFrame_div_div_input").value)
    })

    strategyManager.querySelector(".MainFrame_ManageFrame_div_div_button").addEventListener("click", async function(params) {
        const response = await fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                strategy_Title: strategyManager.querySelector(".MainFrame_ManageFrame_div_div_input").value,
                strategy_Description: strategyManager.querySelector(".MainFrame_ManageFrame_div_div_textarea").value,
            })
        })
        
        addStrategyFrame(strategyManager.querySelector(".MainFrame_ManageFrame_div_div_input").value)
    })


    document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_div_dropdownedit")[0].addEventListener("click", function(){
        managerFrame.style.display = "block"
        emotionManager.style.display = "block"
        strategyManager.style.display = "none"

    })
    document.getElementsByClassName("MainFrame_TradeEntryFrame_TradeFrame_div_dropdownedit")[1].addEventListener("click", function(){
        managerFrame.style.display = "block"
        emotionManager.style.display = "none"
        strategyManager.style.display = "block"
    })


    for (let i = 0; i < ManagerClosebuttons.length; i++) {
        ManagerClosebuttons[i].addEventListener("click", () => {
            managerFrame.style.display = "none";
            emotionManager.style.display = "none";
            strategyManager.style.display = "none";

            strategyManager.querySelector(".MainFrame_ManageFrame_div_div_input").value = ""
            strategyManager.querySelector(".MainFrame_ManageFrame_div_div_textarea").value = ""

            emotionManager.querySelector(".MainFrame_ManageFrame_div_div_input").value = ""
            emotionManager.querySelector(".MainFrame_ManageFrame_div_div_textarea").value = ""
        });
    }


}

for (let i = 0; i < tradedropDownButtons.length; i++) {
    tradedropDownButtons[i].addEventListener("click", async function(e){
        for (let p = 0; p < entryList.length; p++) {
            if (p == i) {
                continue
            }
            entryList[p].style.display = "none";
            entryList[p].setAttribute("open", "false");
        }

        if (entryList[i].getAttribute("open") == "false") {
            console.log("Check")
            entryList[i].setAttribute("open", "true")
            entryList[i].style.display = "block"
        } else if (entryList[i].getAttribute("open") == "true") {
            entryList[i].setAttribute("open", "false")
            entryList[i].style.display = "none"
        }

    })
}


fileInput.addEventListener("change", async function() {
    const file = fileInput.files[0];
    if (!file) return;


    imgInput.style.display = "none"
    imgFrame.style.display = "block";
    imgFrame.src = URL.createObjectURL(file);

    if (fileInput.files.length > 0) {
        tradeEntry['img'] = await toBase64(fileInput.files[0])
    }
});

EntryButton.addEventListener("click", async function() {
    TradeEntryFrame.style.display = "block"
})


async function init() {
    await sleep(3000)
    await loadList()
    loadManager()
}

init()