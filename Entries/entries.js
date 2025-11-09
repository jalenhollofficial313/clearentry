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
    closeButton.addEventListener("click", async function() {
        close_Trade(t.id)
        if (localStorage.getItem("token") != null) {
            if (clientData) {
                const request = window.indexedDB.open("clearentry", 3);
                request.onerror = (event) => {
                    location.reload()
                }
                request.onsuccess = async (event) => {
                    const db = event.target.result;

                    if (db.objectStoreNames.contains("clientData")) {
                        const tx = db.transaction("clientData", "readwrite");
                        const store = tx.objectStore("clientData");
                        clientData.result['trades'][t.id]['open'] = false;
                        closeButton.remove();
                        entryEl.textContent = "Closed";
                        entryEl.classList.toggle("opened-entry", false);
                        entryEl.classList.toggle("closed-entry", true);
                        store.put(clientData.result)
                        tx.oncomplete = () => {
                            db.close();
                        }
                    }
                }
            }
        }
    })

    const viewButton = clone.querySelector(".trade-view-button");
    viewButton.addEventListener('click', async function() {
        entryView.style.display = "block"

        entryEmotion = t.emotion
        entryStrategy = t.strategy
        entryID = t.id

        const viewIMG = entryView.querySelector("#img_Frame")
        viewIMG.src = t.img
        viewIMG.style.visibility = t.img != "" && t.img != null ? "visible" : "hidden"

        const viewEmotion = entryView.querySelector("#state-dropdown-button")
        viewEmotion.childNodes[0].textContent = t.emotion

        const viewStrategy = entryView.querySelector("#strategy-dropdown-button")
        viewStrategy.childNodes[0].textContent = t.strategy

        const viewSymbol = entryView.querySelector("#entry-symbol")
        viewSymbol.value = t.symbol

        const viewPL = entryView.querySelector("#entry-pl")
        viewPL.value = t.PL

        const viewNotes= entryView.querySelector("#entry-notes")
        viewNotes.value = t.notes
    })

    const deleteButton = clone.querySelector(".trade-delete-button");
    deleteButton.addEventListener('click', async function() {
        deleteTrade(t.id)
        if (localStorage.getItem("token") != null) {
            if (clientData) {
                const request = window.indexedDB.open("clearentry", 3);
                request.onerror = (event) => {
                    location.reload()
                }
                request.onsuccess = async (event) => {
                    const db = event.target.result;

                    if (db.objectStoreNames.contains("clientData")) {
                        const tx = db.transaction("clientData", "readwrite");
                        const store = tx.objectStore("clientData");
                        delete clientData.result['trades'][t.id]
                        store.put(clientData.result)
                        tx.oncomplete = () => {
                            db.close();
                        }
                    }
                }
            }
        }
        clone.remove()
    })

    frag.appendChild(clone);
  }

  // Append once, preserves order
  EntriesFrame.appendChild(frag);
}

async function reloadPage() {
    
    const children = Array.from(document.querySelector("#mental-dropdown").children);
    const children2 = Array.from(document.querySelector("#strategy-dropdown").children);

    for (let child of children) {
        child.remove();
    }
    for (let child of children2) {
        child.remove();
    }

    const emotions = clientData.result['emotions']
    for (let emotion in emotions) {
        const button = document.createElement("button")
        button.innerHTML = emotions[emotion]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        button.addEventListener("click", function() {
            entryEmotion = emotions[emotion]
            document.querySelector("#state-dropdown-button").childNodes[0].textContent = emotions[emotion]
        })
        document.querySelector("#mental-dropdown").appendChild(button)
    }

    const strategies = clientData.result['strategies']
    for (let strategy in strategies) {
        const button = document.createElement("button")
        button.innerHTML = strategies[strategy]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        button.addEventListener("click", function() {
            entryStrategy = strategies[strategy]
            document.querySelector("#strategy-dropdown-button").childNodes[0].textContent = strategies[strategy]
        })
        document.querySelector("#strategy-dropdown").appendChild(button)
    }
}

document.querySelector("#state-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#mental-dropdown").style.display == "block") {
        document.querySelector("#mental-dropdown").style.display = "none"
    } else {
        document.querySelector("#mental-dropdown").style.display = "block"
    }
})

document.querySelector("#strategy-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#strategy-dropdown").style.display == "block") {
        document.querySelector("#strategy-dropdown").style.display = "none"
    } else {
        document.querySelector("#strategy-dropdown").style.display = "block"
    }
})


document.getElementById("save-button").addEventListener("click", async function() {
    const response = await fetch("https://edit-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: localStorage.getItem("token"),
            trade_id: entryID,
            PL: entryView.querySelector("#entry-pl").value,
            emotion: entryEmotion,
            notes: entryView.querySelector("#entry-notes").value,
            strategy: entryStrategy,
            symbol: entryView.querySelector("#entry-symbol").value,
        })
    })
    location.reload()
})

document.getElementById("close-button").addEventListener("click", async function() {
    entryView.style.display = "none"
})



async function init() {
    await getClientData()
    await sleep(100)
    
    loadTrades()
    reloadPage()
}

init()

