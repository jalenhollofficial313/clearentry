const messageFrame = document.getElementsByClassName("MainFrame_ChatFrame_MessagesFrame")
const userText = document.getElementById("UserText")
const submitButton = document.getElementById("SubmitButton")
const entriesList = document.getElementById("EntriesList")


let generating = false

let clientData

let currentEntry = ""

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

async function send_Chat(token, input, tradeID) {
    const response = await fetch("https://ai-message-request-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            input: input,
            trade_id: tradeID
        })
    })

    return await response.text()
}

async function textAnimation(p) {


    while (generating == true) {
        await sleep(200)
        if (p.innerHTML.length >= 13) {
            p.innerHTML = "Genearting"
        } else {
            p.innerHTML = p.innerHTML + "."
        }
    }
}

async function createChatFrame(side, message) {
    let chatFrame = document.createElement("div")
    chatFrame.classList.add("MainFrame_ChatFrame_MessagesFrame_MessageFrame")

    let chatP = document.createElement("p")
    chatP.classList.add("MainFrame_ChatFrame_MessagesFrame_MessageFrame_Message")
    chatP.classList.add("inter-text")
    chatFrame.appendChild(chatP)

    messageFrame[0].appendChild(chatFrame)

    if (side == true) {
        chatP.innerHTML = "Generating"
        chatP.classList.add("left-message")
    } else {
        chatP.innerHTML = message
        chatP.classList.add("right-message")
    }

    return chatP
}

submitButton.addEventListener("click", async function() {
    let userInput = userText.value
    if (userInput != "" && userInput != null && userInput.length > 0) {
        generating = true
        userText.value = ""

        await createChatFrame(false, userInput)
        await sleep(500)
        
        let chat = await createChatFrame(true)
        textAnimation(chat)


        let AIResponse = await send_Chat(localStorage.getItem("token"), userInput, currentEntry)
        if (AIResponse != "") {

            currentEntry = ""
            EntryButton.innerHTML = "+ Entry"

            generating = false
            await sleep(200)
            chat.innerHTML = ""
            for (let k in AIResponse) {
                chat.innerHTML = chat.innerHTML + AIResponse[k]
                await sleep(25)
            }
        } else {
            location.reload()
        }
    }
})

async function getTradesOrder(table) {

    let tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b['date'] - a['date']);
    console.log(tableArray)
    return tableArray;
}

async function loadEntries() {
    const trades = await getTradesOrder(clientData['trades'])
    for (let trade in trades) {
        let li = document.createElement("li")
        li.classList.add("MainFrame_ChatFrame_InputFrame_Frame_EntriesFrame_Entry")
        li.classList.add("inter-text")
        li.innerHTML = trades[trade]['symbol']
        entriesList.appendChild(li)

        li.addEventListener("click", async function() {
            currentEntry = trades[trade]['id'] 
            console.log(trades[trade]['symbol'])
            EntryButton.innerHTML = "+ " + trades[trade]['symbol']
            entriesList.style.display = "none"
        })
    }
}

EntryButton.addEventListener("click", async function(params) {
    if (entriesList.style.display == "block") {
        entriesList.style.display = "none"
    } else {
        entriesList.style.display = "block"
    }
})

window.addEventListener("DOMContentLoaded", async () => {
  const trade_id = localStorage.getItem("handoff");
  if (trade_id) {
    localStorage.removeItem("handoff"); // one-time use
    console.log(trade_id)

    generating = true

    let chat = await createChatFrame(true)
    textAnimation(chat)


    let AIResponse = await send_Chat(localStorage.getItem("token"), "", trade_id)
    if (AIResponse != "") {
        generating = false
        await sleep(200)
        chat.innerHTML = ""
        for (let k in AIResponse) {
            chat.innerHTML = chat.innerHTML + AIResponse[k]
            await sleep(25)
        }
    } else {
        location.reload()
    }
  }
});


async function init() {
    await getData(localStorage.getItem("token"))
    await loadEntries()
}

init()