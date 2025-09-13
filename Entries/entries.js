const entriesFrame = document.getElementById("EntriesFrame");

const entryTitle = document.getElementById("Entry-Title")
const entryView = document.getElementById("Entry-View")
const info_values = document.getElementsByClassName("info-value")
const entryNotes = document.getElementsByClassName("MainFrame_EntryView_Entry_TextNotes")
const entryImg = document.getElementById("entry-img")
const entryImgDiv = document.getElementById("img-div")
const closeButton = document.getElementById("close-button")

let clientData

function convertUnixToMonthDayYear(timestamp) {
  const date = new Date(timestamp * 1000); 
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
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

    const tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });

    let newArray = []

    for (let i = 0 ; i < tableArray.length; i++) {
        newArray.push(tableArray[i])
    }

    newArray.sort((a, b) => b['date'] - a['date']);
    console.log(newArray)
    return newArray;
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


async function loadTrades(params) {
    let tradeTable = await getTradesOrder(clientData['trades'])
    for (let trade in tradeTable) {
        let entryFrame = document.createElement("div")
        entryFrame.classList.add("MainFrame_EntriesFrame_Entries_Entry")

        let imgFrame = document.createElement("div")
        imgFrame.classList.add("MainFrame_EntriesFrame_Entries_Entry_ImgFrame")
        entryFrame.appendChild(imgFrame)

        let img = document.createElement("img")
        img.classList.add("MainFrame_EntriesFrame_Entries_Entry_ImgFrame_Img")
        if (tradeTable[trade]['img'] == "") {
            img.style.visibility = "hidden"
        } else {
            img.src = tradeTable[trade]['img'] 
        }
        imgFrame.appendChild(img)

        let title = document.createElement("p")
        title.classList.add("MainFrame_EntriesFrame_Entries_Entry_Title")
        title.classList.add("inter-text")
        title.innerHTML = tradeTable[trade]['title']
        entryFrame.appendChild(title)

        let date = document.createElement("p")
        date.classList.add("MainFrame_EntriesFrame_Entries_Entry_Date")
        date.classList.add("inter-text")
        date.innerHTML = convertUnixToMonthDayYear(tradeTable[trade]['date'])
        entryFrame.appendChild(date)

        entryFrame.addEventListener("mouseenter", async function() {
            entryFrame.classList.add("entry-hover")
        })

        entryFrame.addEventListener("mouseleave", async function() {
            entryFrame.classList.remove("entry-hover")
        })
        
        entryFrame.addEventListener("click", async function() {
            entryFrame.classList.remove("entry-hover")
            await sleep(250)

            entryTitle.innerHTML = tradeTable[trade]['title']

            if (tradeTable[trade]['img'] != "") {
                entryImg.src = tradeTable[trade]['img']
                entryImg.style.display = "unset"
                entryImgDiv.style.display = "none"
            } else {
                entryImg.style.display = "none"
                entryImgDiv.style.display = "unset"
            }

            info_values[0].innerHTML = tradeTable[trade]['strategy']
            info_values[1].innerHTML = "0min"
            if (tradeTable[trade]['open'] == false) {
                info_values[1].innerHTML = formatTime(tradeTable[trade]['t_Log'])
            }
            info_values[2].innerHTML = tradeTable[trade]['symbol']
            info_values[3].innerHTML = tradeTable[trade]['emotion_Start']
            info_values[4].innerHTML = tradeTable[trade]['emotion_End']
            if (tradeTable[trade]['PL'] > 0) {
                info_values[5].innerHTML = "+$" + tradeTable[trade]['PL']
            } else if (tradeTable[trade]['PL'] < 0) {
                info_values[5].innerHTML = "-$" + tradeTable[trade]['PL']
            } else {
                info_values[5].innerHTML = "$" + tradeTable[trade]['PL']
            }

            entryNotes[0].innerHTML = tradeTable[trade]['open_Notes']
            entryNotes[1].innerHTML = tradeTable[trade]['close_Notes']

            entryView.style.display = "unset"

        })

        entriesFrame.appendChild(entryFrame)
    }
}
closeButton.addEventListener("click", async function () {
    entryView.style.display = "none"
})

async function init() {
    await getData(localStorage.getItem("token"))
    await loadTrades()
}

init()

