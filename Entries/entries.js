const entriesFrame = document.getElementById("EntriesFrame");

const tradeExample = document.getElementById("Clone-Entry")
const EntriesFrame = document.getElementById("EntriesFrame")

const entryView = document.getElementById("TradeView")
const entryViewList = document.getElementsByClassName("MainFrame_TradeEntryView_TradeFrame_div_dropdown")
const entrydropDownButtons = document.getElementsByClassName("MainFrame_TradeEntryView_TradeFrame_div_dropdownbutton")


let entryEmotion = ""
let entryStrategy = ""
let entryID = ""

let clientData
let tradeData

function convertUnixToMonthDayYear(timestamp) {
  const date = new Date(timestamp * 1000); 
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options); 
}


function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = [];

    if (hours > 0) {
        result.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    }
    if (minutes > 0 || hours === 0) {
        result.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
    }

    return result.join(' ');
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function getTradesOrder(table) {

    let tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b['date'] - a['date']);
    console.log(tableArray)
    return tableArray;
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
}


async function loadTrades() {
  const frag = document.createDocumentFragment();

  for (let i = 0; i < tradeData.length; i++) {
    const t = tradeData[i];
    const clone = tradeExample.cloneNode(true);
    clone.style.display = "block";

    // Fill inside the clone (not the whole document)
    clone.querySelector(".strategy-text").textContent = t.strategy ?? "";
    clone.querySelector(".emotion-text").textContent = t.emotion ?? "";

    // P/L
    const plEl = clone.querySelector(".PL-text");
    const value = Number(t.PL) || 0;
    plEl.classList.remove("green-text", "red-text");
    if (value > 0) {
      plEl.textContent = `+$${Math.abs(value)}`;
      plEl.classList.add("green-text");
    } else if (value < 0) {
      plEl.textContent = `-$${Math.abs(value)}`;
      plEl.classList.add("red-text");
    } else {
      plEl.textContent = "$0";
    }

    const entryTitle = clone.querySelector(".entry-title")
    entryTitle.innerHTML = t.symbol

    const entryIMG = clone.querySelector(".entry-img")
    entryIMG.src = t.img != "" && t.img != null ? t.img : ""
    entryIMG.style.display = t.img != "" && t.img != null ? "block" : "none"

    // Date (your timestamps look like seconds with decimals)
    const dateEl = clone.querySelector(".date-text");
    dateEl.textContent = convertUnixToMonthDayYear(Math.floor(Number(t.date)));

    // Open/Closed
    const entryEl = clone.querySelector(".entry-type");
    const isOpen = t.open === true || t.open === "true";
    entryEl.textContent = isOpen ? "Open" : "Closed";
    entryEl.classList.toggle("opened-entry", isOpen);
    entryEl.classList.toggle("closed-entry", !isOpen);

    const closeButton = clone.querySelector(".trade-close-button");
    closeButton.style.display = t.open == true ? "block" : "none"
    closeButton.addEventListener("click", async function() {
        const response = await fetch("https://close-trade-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                trade_id: t.id
            })
        })
        location.reload()
    })

    const viewButton = clone.querySelector(".trade-view-button");
    viewButton.addEventListener('click', async function() {
        entryView.style.display = "block"

        entryEmotion = t.emotion
        entryStrategy = t.strategy
        entryID = t.id

        const viewIMG = entryView.querySelector(".MainFrame_TradeEntryView_TradeFrame_div_imgdiv_img")
        viewIMG.src = t.img
        viewIMG.style.display = t.img != "" && t.img != null ? "block" : "none"

        const viewEmotion = entryView.querySelector(".select-text-emotion")
        viewEmotion.innerHTML = t.emotion

        const viewStrategy = entryView.querySelector(".select-text-strategy")
        viewStrategy.innerHTML = t.strategy

        const viewSymbol = entryView.querySelector("#view-symbol")
        viewSymbol.value = t.symbol

        const viewPL = entryView.querySelector("#view-PL")
        viewPL.value = t.PL

        const viewNotes= entryView.querySelector("#view-Notes")
        viewNotes.value = t.notes
    })

    frag.appendChild(clone);
  }

  // Append once, preserves order
  EntriesFrame.appendChild(frag);
}

async function loadDropDown() {
    for (let emotion = 0; emotion < clientData['emotions'].length; emotion++) {
        let li = document.createElement("li")
        li.innerHTML = clientData['emotions'][emotion]
        li.classList.add("MainFrame_TradeEntryView_TradeFrame_div_dropdown_text")
        li.classList.add("inter-text")

        li.addEventListener("click", async function(){
            entryEmotion = clientData['emotions'][emotion]
            entryView.querySelector(".select-text-emotion").textContent  = clientData['emotions'][emotion] 
        })

        entryViewList[1].appendChild(li)
    }

    for (let strategy = 0; strategy < clientData['strategies'].length; strategy++) {
       let li = document.createElement("li")
       li.innerHTML = clientData['strategies'][strategy]
       li.classList.add("MainFrame_TradeEntryView_TradeFrame_div_dropdown_text")
       li.classList.add("inter-text")

       li.addEventListener("click", async function(){
            entryStrategy = clientData['strategies'][strategy]
            entryView.querySelector(".select-text-strategy").textContent  = clientData['strategies'][strategy] 
       })

       entryViewList[0].appendChild(li)
    }
}

for (let i = 0; i < entrydropDownButtons.length; i++) {
    entrydropDownButtons[i].addEventListener("click", async function(e){
        for (let p = 0; p < entryViewList.length; p++) {
            if (p == i) {
                continue
            }
            entryViewList[p].style.display = "none";
            entryViewList[p].setAttribute("open-view", "false");
        }

        if (entryViewList[i].getAttribute("open-view") == "false") {
            console.log("Check")
            entryViewList[i].setAttribute("open-view", "true")
            entryViewList[i].style.display = "block"
        } else if (entryViewList[i].getAttribute("open-view") == "true") {
            entryViewList[i].setAttribute("open-view", "false")
            entryViewList[i].style.display = "none"
        }

    })
}



document.getElementById("Save_button").addEventListener("click", async function() {
    const response = await fetch("https://edit-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"),
            trade_id: entryID,
            PL: entryView.querySelector("#view-PL").value,
            emotion: entryEmotion,
            notes: entryView.querySelector("#view-Notes").value,
            strategy: entryStrategy,
            symbol: entryView.querySelector("#view-symbol").value,
        })
    })
    location.reload()
})



async function init() {
    await getData(localStorage.getItem("token"))
    tradeData = await getTradesOrder(clientData['trades'])
    loadTrades()
    loadDropDown()
}

init()

