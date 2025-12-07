const entriesFrame = document.getElementById("EntriesFrame");

const tradeExample = document.getElementById("Clone-Entry")
const EntriesFrame = document.getElementById("EntriesFrame")

const entryView = document.getElementById("TradeView")
const entryViewList = document.getElementsByClassName("MainFrame_TradeEntryView_TradeFrame_div_dropdown")
const entrydropDownButtons = document.getElementsByClassName("MainFrame_TradeEntryView_TradeFrame_div_dropdownbutton")


let entryEmotion = ""
let entryStrategy = ""
let entryID = ""


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

let client_server_debounce = false
async function loadingFrame(ms, text1, text2) {
    client_server_debounce = true
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");

    loadedFrame.style.display = "none"
    loadingDiv.style.display = "flex"
    loadingDiv.querySelector("p").innerHTML = text1
    loadingFrame.style.display = "block"
    await sleep(100)
    loadingFrame.style.transform = "translateY(0px)"
    while (client_server_debounce == true) {
        await sleep(100)
    }
    loadedFrame.style.display = "flex"
    loadingDiv.style.display = "none"
    loadedFrame.querySelector("p").innerHTML = text2
    await sleep(1000)
    loadingFrame.style.transform = "translateY(200px)"
    await sleep(700)
    loadingFrame.style.display = "block"
}

async function deleteTrade(tradeid) {
    const response = await fetch("https://delete-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"),
            trade_id: tradeid
        })
    })
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

async function close_Trade(tradeid) {
    const response = await fetch("https://close-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"),
            trade_id: tradeid
        })
    })
}

async function loadTrades() {
  const frag = document.createDocumentFragment();

  const tradeData = await getTradesOrder(clientData.result['trades'])
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


    const viewButton = clone.querySelector(".trade-view-button");
    viewButton.addEventListener('click', async function() {
        localStorage.setItem("tradeView", t.id)
        window.location.href = "../TradeLogging/tradelogging.html"
    })

    const deleteButton = clone.querySelector(".trade-delete-button");
    deleteButton.addEventListener('click', async function() {
        loadingFrame(0, "Deleting Trade...", "Deleted.")
        await deleteTrade(t.id)
        await updateClientData()
        client_server_debounce = false
        clone.remove()
    })

    frag.appendChild(clone);
  }

  // Append once, preserves order
  EntriesFrame.appendChild(frag);
}


document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-icon").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
});





async function entries_init() {
    await getClientData()
    await sleep(100)
    

    loadTrades()
}

entries_init()

