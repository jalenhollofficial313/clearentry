// Example trade data (replace this with your actual data)
let tradeData

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Utility: convert day → start/end timestamps
function getDayRange(year, month, day) {
  const start = new Date(year, month, day, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59);
  return {
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
  };
}

async function unixToTimeOfDayAMPM(unixTimestamp) {
  // detect seconds vs milliseconds
  if (unixTimestamp.toString().length === 10) {
    unixTimestamp *= 1000; // convert seconds → ms
  }

  const date = new Date(unixTimestamp);
  console.log(date)
  let hours = date.getHours();
  const minutes = date.getMinutes();

  // Determine AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Format nicely
  const formatted = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;

  return formatted;
}


// Main logic
async function analyzeTradesByDay(trades) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // current month (0-based)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayElements = document.querySelectorAll(
        ".MainFrame_Frame_Frame_MainStats_Calender_div"
    );
    const dayTrades = document.querySelectorAll(
        ".trade-amount"
    );

    const dayPL = document.querySelectorAll(
        ".trade-pl"
    );

    const dayEmotion = document.querySelectorAll(
        ".trade-emotion"
    );


    for (let day = 1; day <= daysInMonth; day++) {
        const { startUnix, endUnix } = getDayRange(year, month, day);

        // Find trades within that day
        const tradesForDay = trades.filter(
            (t) => t.date >= startUnix && t.date <= endUnix
        );

        const emotionCounts = {};
        for (const trade of tradesForDay) {
            if (!trade.emotion) continue;
            const e = trade.emotion.trim();
            emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        }

        let mostFrequent = null;
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(emotionCounts)) {
            if (count > maxCount) {
            mostFrequent = emotion;
            maxCount = count;
            }
        }

        // Calculate total P/L for the day
        const dailyPL = tradesForDay.reduce((sum, t) => sum + Number(t.PL || 0), 0);

        // Find the calendar element for this day
        const dayEl = dayElements[day - 1];
        if (!dayEl) continue;

        const tradesAmount = dayTrades[day - 1];
        if (!tradesAmount) continue;

        const tradesPL = dayPL[day - 1];
        if (!tradesPL) continue;

        const tradesEmotion = dayEmotion[day - 1];
        if (!tradesEmotion) continue;


        // Highlight based on data
        if (tradesForDay.length > 0) {
            if (dailyPL > 0) {
                tradesPL.innerHTML = "+$" + dailyPL
                tradesPL.classList.add("green-text")
            } else if (dailyPL < 0) {
                tradesPL.innerHTML = "-$" + dailyPL
                tradesPL.classList.add("red-text")
            } else {
                tradesPL.innerHTML = "$" + dailyPL
            }

            const emotionCounts = {};
            for (const trade of tradesForDay) {
                if (!trade.emotion) continue;
                const e = trade.emotion.trim();
                emotionCounts[e] = (emotionCounts[e] || 0) + 1;
            }

            // 3️⃣ Find most frequent emotion
            let mostFrequentEmotion = "None";
            let maxCount = 0;
            for (const [emotion, count] of Object.entries(emotionCounts)) {
                if (count > maxCount) {
                    mostFrequentEmotion = emotion;
                    maxCount = count;
                }
            }


            tradesEmotion.innerHTML = mostFrequentEmotion

            // Tooltip (hover info)
            tradesAmount.innerHTML = tradesForDay.length + " Trade/s"
        }
    }
}

function roundTo(num, decimals = 0) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}


async function loadData() {
    wins = 0
    losses = 0

    totalWinPL = 0
    totalLossPL = 0

    tradeAmount = 0
    let totalPL = 0

    let mostEmotionAmount = 0
    let mostEmotion = "None"

    let totalemotionAmounts = 0

    let Emotions = clientData.result["emotions"]
    let EmotionPL = []
    
    for (let emotion in Emotions) {
        let emotionAmount = 0
        for (let trade in clientData.result['trades']) {
            if (clientData.result['trades'][trade]['emotion'] == Emotions[emotion]) {
                totalemotionAmounts += 1
                emotionAmount += 1
                if (EmotionPL[Emotions[emotion]] != null) {
                    EmotionPL[Emotions[emotion]] += clientData.result['trades'][trade]['PL']
                } else {
                    EmotionPL[Emotions[emotion]] = clientData.result['trades'][trade]['PL']
                }
            }
        }
        if (emotionAmount > mostEmotionAmount) {
            mostEmotionAmount = emotionAmount
            mostEmotion = Emotions[emotion]
        }
    }

    let mostProfitableEmotion = "None"
    let mostProfit = 0
    for (let i in EmotionPL) {
        if (EmotionPL[i] > mostProfit) {
            mostProfit = EmotionPL[i]
            mostProfitableEmotion = i
        }
    }


    let Strategies = clientData.result["strategies"]
    let StrategyPL = []
    
    for (let strategy in Strategies) {
        for (let trade in clientData.result['trades']) {
            if (clientData.result['trades'][trade]['strategy'] == Strategies[strategy]) {
                if (StrategyPL[Strategies[strategy]] != null) {
                    StrategyPL[Strategies[strategy]] += clientData.result['trades'][trade]['PL']
                } else {
                    StrategyPL[Strategies[strategy]] = clientData.result['trades'][trade]['PL']
                }
            }
        }
    }

    let mostProfitableStrategy = "None"
    let mostStratProfit = 0
    for (let i in StrategyPL) {
        if (StrategyPL[i] > mostStratProfit) {
            mostStratProfit = StrategyPL[i]
            mostProfitableStrategy = i
        }
    }

    let totalSeconds = 0

    for (let trade in clientData.result['trades']) {
        tradeAmount += 1
        totalPL += clientData.result['trades'][trade]['PL']
        if (clientData.result['trades'][trade]['PL'] > 0 ) {
            totalWinPL += clientData.result['trades'][trade]['PL']
            wins += 1
            const date = new Date(clientData.result['trades'][trade]['date'] * 1000); // convert UNIX (seconds) → ms

            // get hours/minutes/seconds of day     
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();

            // convert that to total seconds since midnight
            const timeOfDaySeconds = hours * 3600 + minutes * 60 + seconds;

            // add to total
            totalSeconds += timeOfDaySeconds;
        }
        if (clientData.result['trades'][trade]['PL'] < 0 ) {
            totalLossPL += clientData.result['trades'][trade]['PL']
            losses += 1
        }
    }

    avgWin = totalWinPL / wins
    avgLoss = totalLossPL / losses

    let WinRate = Math.floor((wins / tradeAmount) * 100)
    let LossRate = (losses / tradeAmount) * 100
    let ProfitFactor = roundTo(totalWinPL / Math.abs(totalLossPL), 1)
    let Expectancy = Math.floor(((WinRate/100) * avgWin) - ((LossRate/100) * avgLoss))
    let EmotionalConsistency =  Math.floor((mostEmotionAmount / totalemotionAmounts) * 100)
    let bestTime = totalSeconds / wins

    const statText = document.querySelectorAll(".MainFrame_Frame_Frame_TopStats_Stat_text")
    const statText2 = document.querySelectorAll(".MainFrame_Frame_Frame_MainStats_StatsFrame_Stat_Text")
    if (totalPL > 0) {
        statText[0].innerHTML = "+$" + totalPL
        statText[0].classList.add("green-text")
    } else if (totalPL < 0) {
        statText[0].innerHTML = "-$" + totalPL
        statText[0].classList.add("red-text")
    } else {
        statText[0].innerHTML = "$" + totalPL
    }
    statText[1].innerHTML = WinRate + "%"
    statText[2].innerHTML = ProfitFactor
    if (Expectancy > 0) {
        statText[3].innerHTML = "+$" + Expectancy
        statText[3].classList.add("green-text")
    } else if (Expectancy < 0) {
        statText[3].innerHTML = "-$" + Expectancy
        statText[3].classList.add("red-text")
    } else {
        statText[3].innerHTML = "$" + Expectancy
    }
    statText2[0].innerHTML = mostEmotion
    statText2[1].innerHTML = mostProfitableEmotion
    statText2[2].innerHTML = EmotionalConsistency + "%" 
    if (bestTime) {
        statText2[3].innerHTML = await unixToTimeOfDayAMPM(bestTime)
    } else {
        statText2[3].innerHTML = "N/A"
    }
    statText2[4].innerHTML = mostProfitableStrategy || "N/A"
}

// Select your calendar container

async function loadDate(params) {
    const cal = document.querySelector(".MainFrame_Frame_Frame_MainStats_Calender");

    // Get current date info
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = Jan, 11 = Dec

    // Get the total number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Clear existing HTML (optional, if re-rendering)
    cal.innerHTML = "";

    // Loop through and create a div for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const num = String(d).padStart(2, "0"); // Formats 1 → 01, 2 → 02, etc.

        cal.insertAdjacentHTML(
            "beforeend",
            `
            <div class="MainFrame_Frame_Frame_MainStats_Calender_div">
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date inter-text">${num}</p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-amount inter-text"></p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-pl inter-text green-text"></p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-emotion inter-text"></p>
            </div>
            `
        );
    }
}


async function getTradesOrder(table) {

    let tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b['date'] - a['date']);
    console.log(tableArray)
    return tableArray;
}





// Run when DOM is ready
document.addEventListener("DOMContentLoaded", async function() {
    await getClientData()
    await sleep(100)

    loadDate()
    tradeData = await getTradesOrder(clientData.result['trades'])
    analyzeTradesByDay(tradeData)
    loadData()
});
