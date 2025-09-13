const TradeFrame = document.getElementsByClassName("MainFrame_Trades_TradeFrame")

let clientData

function convertUnixToMonthDayYear(timestamp) {
  const date = new Date(timestamp * 1000); 
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options); 
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

    newArray.sort((a, b) => b['date'] - a['date']);
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
    console.log(clientData)
}


async function loadTrades(params) {
    let tradeTable = await getTradesOrder(clientData['trades'])
    console.log(tradeTable)
    for (let i of tradeTable) {
        const tradediv = document.createElement("div");
        tradediv.classList.add("MainFrame_Trades_TradeFrame_Trade")
        tradediv.classList.add("tradeframe")

        const tradedate = document.createElement("p");
        tradedate.innerHTML = convertUnixToMonthDayYear(i["date"])
        tradedate.classList.add("MainFrame_Trades_TradeFrame_Trade_Date")
        tradedate.classList.add("inter-text")
        tradedate.classList.add("tradeframe-text")
        tradediv.appendChild(tradedate)

        const tradesymbol = document.createElement("p");
        tradesymbol.innerHTML =i["symbol"]
        tradesymbol.classList.add("MainFrame_Trades_TradeFrame_Trade_Symbol")
        tradesymbol.classList.add("inter-text")
        tradesymbol.classList.add("tradeframe-text")
        tradediv.appendChild(tradesymbol)

        const tradePL= document.createElement("p");
        tradePL.classList.add("MainFrame_Trades_TradeFrame_Trade_PL")
        tradePL.classList.add("inter-text")
        tradePL.classList.add("tradeframe-text")
        tradediv.appendChild(tradePL)

        if (i["PL"] > 0) {
            tradePL.classList.add("green-text")
            tradePL.innerHTML = "+$" + i["PL"]
        } else if (i["PL"] < 0) {
            tradePL.classList.add("red-text")
            tradePL.innerHTML = "-$" + Math.abs(i["PL"])
        }

        const tradeEmotion= document.createElement("p");
        tradeEmotion.innerHTML = i["emotion_Start"]
        tradeEmotion.classList.add("MainFrame_Trades_TradeFrame_Trade_Emotion")
        tradeEmotion.classList.add("inter-text")
        tradeEmotion.classList.add("tradeframe-text")
        tradediv.appendChild(tradeEmotion)

        TradeFrame[0].appendChild(tradediv)
    }

    return true
}

async function tradesINIT(params) {
    await getData(localStorage.getItem("token"))
    loaded = await loadTrades()
}


tradesINIT()