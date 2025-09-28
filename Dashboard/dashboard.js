
const winRate = document.getElementById("winRate_Text");
const plTotal = document.getElementById("plTotal_Text");
const avgHoldTime = document.getElementById("avgHoldTime_Text");
const avgEmotion = document.getElementById("avgEmotion_Text")

const emotionRate = document.getElementById('emotionRate');
const plCurve = document.getElementById("plCurve")

const TradeFrame = document.getElementById("TradeFrame")
const DailyReflectionText = document.getElementById("DailyReflectionText")

let clientData

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function convertUnixToMonthDay(timestamp) {
  const date = new Date(timestamp * 1000); 
  const options = { month: 'long', day: 'numeric' };
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

async function getTotalPL() {
    tradeAmount = 0
    totalAmount = 0
    for (let trade in clientData['trades']) {
        if (clientData['trades'][trade]['open'] == false) {
            tradeAmount += 1
            totalAmount += Number(clientData['trades'][trade]['PL']) || 0
        }
    }

    return totalAmount
}

async function getWR() {
    wins = 0
    tradeAmount = 0
    for (let trade in clientData['trades']) {
        tradeAmount += 1
        if (clientData['trades'][trade]['PL'] > 0 ) {
            wins += 1
        }
    }

    console.log(wins)

    return (wins / tradeAmount) * 100
}

async function getHoldTime() {
    holdtime = 0
    tradeAmount = 0
    for (let trade in clientData['trades']) {
        if (clientData['trades'][trade]['open'] == true) {
            continue
        }
        tradeAmount += 1
        holdtime += clientData['trades'][trade]['t_Log']
    }


    return (holdtime / tradeAmount) 
}

async function getavgEmotion() {
    let mostEmotionAmount = 0
    let mostEmotion = "None"

    let Emotions = clientData["emotions"]
    
    for (let emotion in Emotions) {
        let emotionAmount = 0
        for (let trade in clientData['trades']) {
            if (clientData['trades'][trade]['emotion'] == emotion) {
                emotionAmount += 1
            }
        }
        if (emotionAmount > mostEmotionAmount) {
            mostEmotionAmount = emotionAmount
            mostEmotion = emotion
        }
    }

    return mostEmotion
}

async function getTradesOrder(table) {

    const tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });

    let newArray = []

    for (let i = 0 ; i < tableArray.length; i++) {
        if (!tableArray[i]['Test']) {
            newArray.push(tableArray[i])
        }
    }

    newArray.sort((a, b) => b['date'] - a.date['date']);
    return tableArray;
}


async function setTrades() {
    let number = 1
    let tradeTable = await getTradesOrder(clientData['trades'])

    for (let trade in tradeTable) {
        if (number > 3) {
            return
        }
        number += 1
        const tradeDiv = document.createElement("div")
        tradeDiv.classList.add("MainFrame_StatFrame3_Stat_TradesFrame_Trade")

        const tradeDate = document.createElement("p")
        tradeDate.classList.add("MainFrame_StatFrame3_Stat_TradesFrame_Trade_Date")
        tradeDate.classList.add("inter-text")
        tradeDate.innerHTML = convertUnixToMonthDay(tradeTable[trade]['date'])
        tradeDiv.appendChild(tradeDate)

        const tradeSymbol = document.createElement("p")
        tradeSymbol.classList.add("MainFrame_StatFrame3_Stat_TradesFrame_Trade_Symbol")
        tradeSymbol.classList.add("inter-text")
        tradeSymbol.innerHTML = tradeTable[trade]['symbol']
        tradeDiv.appendChild(tradeSymbol)

        const tradePL = document.createElement("p")
        tradePL.classList.add("MainFrame_StatFrame3_Stat_TradesFrame_Trade_Date_PL")
        tradePL.classList.add("inter-text")
        if (tradeTable[trade]['PL'] > 0) {
            tradePL.innerHTML = "+$" + Math.abs(tradeTable[trade]['PL'])
            tradePL.style.color = "#1fd866"
        } else if (tradeTable[trade]['PL'] < 0) {
            tradePL.innerHTML = "-$" + Math.abs(tradeTable[trade]['PL'])
            tradePL.style.color = "red"
        }
        tradeDiv.appendChild(tradePL)

        TradeFrame.appendChild(tradeDiv)
    }
}

async function setData(userData) {
    winRate.innerHTML = "%" + Math.floor(await getWR());
    if (await getTotalPL() > -1) {
        plTotal.innerHTML = "+$" + Math.abs(await getTotalPL());
    } else if (await getTotalPL() < 0) {
        plTotal.innerHTML = "-$" + Math.abs(await getTotalPL());
    } else {
        plTotal.innerHTML = "$0"
    }
    avgHoldTime.innerHTML = formatTime(await getHoldTime()) || "N/A";
    avgEmotion.innerHTML = await getavgEmotion()
    DailyReflectionText.innerHTML = userData['dailyReflection']
    loaded = setTrades()

    return true
}

async function getTradesEmotion(Emotion) {
    emotionArray = []
    let lastemotion = ""
    let index = 0

    for (let emotion in clientData['emotions']) {
        if (lastemotion == "") {
            lastemotion = emotion
        }
        for (let trade in clientData['trades']) {
            if (clientData['trades'][trade]['emotion'] == emotion) {
                if (lastemotion != emotion) {
                    index++
                    lastemotion = emotion
                }
                if (emotionArray[index]) {
                    emotionArray[index]++
                } else {
                    emotionArray[index] = 1
                }
            }
        }
    }

    return emotionArray
}

function getMonthUnixRange(monthName) {
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth(); // 0 for Jan, 1 for Feb...

    const now = new Date();
    const year = now.getFullYear();

    const start = new Date(year, monthIndex, 1, 0, 0, 0).getTime() / 1000;
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime() / 1000;

    return { start, end };
}


async function getTradePL(targetMonth) {
    const trades = clientData['trades'];


    const { start, end } = getMonthUnixRange(targetMonth);


    let totalPL = 0;
    let tradeCount = 0;

    for (const tradeKey in trades) {
        const trade = trades[tradeKey];
        const tradeTime = trade.date; 
        const tradePL = trade.PL;


        if (tradeTime >= start && tradeTime <= end) {
            totalPL += Number(tradePL);
            tradeCount += 1;
        }
    }


    const avgMonthPL = tradeCount > 0 ? totalPL / tradeCount : 0;

    console.log(totalPL)

    return totalPL;
}

async function getEmotionsList() {
    newarray = []
    for (let emotion in clientData['emotions']) {
        newarray.push(emotion)
    }


    console.log(newarray)
    return newarray
}


async function loadGraphs(params) {
    new Chart(emotionRate, {
        type: 'bar',
        data: {
        labels: await getEmotionsList(),
        datasets: [{

            label: '# of Votes',
            data: await getTradesEmotion(),
            borderWidth: 1,
            borderColor: '#19c257',
            backgroundColor: '#19c257'
        }]
        },
        options: {
        scales: {
            y: {
             beginAtZero: true
            }
        },
        }
    });   

    new Chart(plCurve, {
        type: 'line',
        data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'PL Curve',
            data: [
                    await getTradePL("January"),
                    await getTradePL("February"),
                    await getTradePL("March"),
                    await getTradePL("April"),
                    await getTradePL("May"),
                    await getTradePL("June"),
                    await getTradePL("July"),
                    await getTradePL("August"),
                    await getTradePL("September"),
                    await getTradePL("October"),
                    await getTradePL("November"),
                    await getTradePL("December")
                ],

            borderWidth: 1,
            borderColor: '#19c257',
            backgroundColor: '#19c257'
        }]
    }
    }); 

    return true
}

async function dashboardINIT() {

    await getData(localStorage.getItem("token"))
    setclientData = setData(clientData)

    loaded = loadGraphs()
}


dashboardINIT();
