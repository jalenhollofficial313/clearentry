const emotionRate = document.getElementById("emotionRate")
const emotionPL = document.getElementById("emotionPL")
const FeedBack_Text = document.getElementById("FeedBack_Text")
const emotionTracking = document.getElementById("emotionTracking")

let clientData

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

async function getTradeEmotionPL() {
    emotionPLArray = []
    emotionAmountArray = []

    let lastemotion = ""
    let index = 0

    for (let emotion in clientData['emotions']) {
        if (lastemotion == "") {
            lastemotion = emotion
        }
        for (let trade in clientData['trades']) {
            if (clientData['trades'][trade]['emotion'] == emotion) {
                if (clientData['trades'][trade].open == true) {
                    continue
                }
                if (lastemotion != emotion) {
                    index++
                    lastemotion = emotion
                }
                if (emotionPLArray[index]) {
                    emotionPLArray[index] += clientData['trades'][trade].PL
                } else {
                    emotionPLArray[index] = clientData['trades'][trade].PL
                }
            }
        }
    }

    return emotionPLArray
}

function getMonthUnixRange(monthName) {
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth(); // 0 for Jan, 1 for Feb...

    const now = new Date();
    const year = now.getFullYear();

    const start = new Date(year, monthIndex, 1, 0, 0, 0).getTime() / 1000;
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime() / 1000;

    return { start, end };
}



async function getavgEmotion(targetMonth) {
    const trades = clientData['trades'];

    const { start, end } = getMonthUnixRange(targetMonth);

    const emotionCount = {};

    for (const tradeKey in trades) {
        let trade = trades[tradeKey];
        let tradeTime = trade['date'];
        let emotion = trade['emotion'];

        if (tradeTime >= start && tradeTime <= end && emotion) {

            if (emotionCount[emotion]) {
                emotionCount[emotion]++;
            } else {
                emotionCount[emotion] = 1;
            }
        }
    }

    let mostFrequentEmotion = null;
    let maxCount = 0;

    for (const emotion in emotionCount) {
        if (emotionCount[emotion] > maxCount) {
            maxCount = emotionCount[emotion];
            mostFrequentEmotion = emotion;
        }
    }



    return mostFrequentEmotion || "No Data";
}

async function getEmotionsList() {
    newarray = []
    for (let emotion in clientData['emotions']) {
        newarray.push(emotion)
    }

    return newarray
}



async function loadGraphs() {
  // Fetch everything in parallel
  const monthsFull  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const [emotionLabels, tradesEmotion, tradeEmotionPL, monthValsRaw] = await Promise.all([
    getEmotionsList(),                   // e.g., ["Calm","Anxious","Angry", ...]
    getTradesEmotion(),                  // bar #1 data
    getTradeEmotionPL(),                 // bar #2 data
    Promise.all(monthsFull.map(getavgEmotion)) // monthly indices (or numbers to be rounded)
  ]);

  // Normalize monthly values to integer indices within label range
  const maxIndex = Math.max(0, emotionLabels.length - 1);
  const monthValues = monthValsRaw.map(v => {
    const n = Math.round(Number(v) || 0);
    return Math.min(maxIndex, Math.max(0, n));
  });

  // (Optional) destroy existing charts to prevent overlay if re-rendering
  const maybeDestroy = (canvasEl) => {
    if (canvasEl && canvasEl._chartInstance) {
      canvasEl._chartInstance.destroy();
      canvasEl._chartInstance = null;
    }
  };
  maybeDestroy(emotionRate);
  maybeDestroy(emotionPL);
  maybeDestroy(emotionTracking);

  // Bar: Emotion frequency/rate
  const rateChart = new Chart(emotionRate, {
    type: 'bar',
    data: {
      labels: emotionLabels,
      datasets: [{
        label: 'Avg Emotion',
        data: tradesEmotion,
        borderWidth: 1,
        borderColor: '#358b38',
        backgroundColor: '#358b38'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
  emotionRate._chartInstance = rateChart;

  // Bar: PL by emotion
  const plChart = new Chart(emotionPL, {
    type: 'bar',
    data: {
      labels: emotionLabels,
      datasets: [{
        label: 'Avg P/L',
        data: tradeEmotionPL,
        borderWidth: 1,
        borderColor: '#358b38',
        backgroundColor: '#358b38'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
  emotionPL._chartInstance = plChart;

  // Line: Most frequent emotion per month (Y = index mapped to label)
  const trackingChart = new Chart(emotionTracking, {
    type: 'line',
    data: {
      labels: monthsShort,
      datasets: [{
        label: 'Most Frequent Emotion',
        data: monthValues,
        borderWidth: 1,
        fill: true,
        borderColor: '#358b38',
        tension: 0
      }]
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: maxIndex,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return emotionLabels[value] ?? '';
            }
          }
        }
      }
    }
  });
  emotionTracking._chartInstance = trackingChart;

  // Other UI
  if (typeof FeedBack_Text !== 'undefined' && clientData && clientData['dailyReflection'] != null) {
    FeedBack_Text.innerHTML = clientData['dailyReflection'];
  }
}

async function emotionsINIT() {
    await getData(localStorage.getItem("token"))

    loaded = await loadGraphs()
}

emotionsINIT()