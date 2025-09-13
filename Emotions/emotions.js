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

async function getTradesEmotion() {
    emotionArray = []

    for (let i = 0; i < clientData['emotions'].length; i++) {
        for (let trade in clientData['trades']) {
            if (clientData['trades'][trade]['emotion_Start'] == clientData['emotions'][i]) {
                if (emotionArray[i]) {
                    emotionArray[i]++
                } else {
                    emotionArray[i] = 1
                }
            }
        }
    }

    return emotionArray
}

async function getTradeEmotionPL() {
    emotionPLArray = []
    emotionAmountArray = []


    for (let i = 0; i < clientData['emotions'].length; i++) {
        for (let trade in clientData['trades']) {
            if (clientData['trades'][trade]['open'] == true) {
                continue
            }
            if (clientData['trades'][trade]['emotion_Start'] == clientData['emotions'][i]) {
                if (emotionAmountArray[i]) {
                    emotionPLArray[i] += Number(clientData['trades'][trade]['PL'])
                    emotionAmountArray[i]++
                } else {
                    emotionPLArray[i] = Number(clientData['trades'][trade]['PL'])
                    emotionAmountArray[i] = 1
                }
            }
        }
    }

    for (let i = 0; i < emotionAmountArray.length; i++){
        emotionPLArray[i] = emotionPLArray[i] / emotionAmountArray[i]
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
        let emotion = trade['emotion_Start'];

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

    console.log(mostFrequentEmotion)

    return mostFrequentEmotion || "No Data";
}



async function loadGraphs() {

    new Chart(emotionRate, {
        type: 'bar',
        data: {
        labels: clientData['emotions'],
        datasets: [{
            label: 'avg Emotion',
            data: await getTradesEmotion(),
            borderWidth: 1,
            borderColor: "#358b38",
            backgroundColor: '#358b38'
        }]
        },
        options: {
        scales: {
            y: {
            beginAtZero: true
            }
        }
        }
    });   

    new Chart(emotionPL, {
        type: 'bar',
        data: {
        labels: clientData['emotions'],
        datasets: [{
            label: 'avg PL',
            data: await getTradeEmotionPL(),
            borderWidth: 1,
            borderColor: "#358b38",
            backgroundColor: '#358b38'
        }]
        },
        options: {
        scales: {
            y: {
            beginAtZero: false
            }
        }
        }
    });   



    const emotionTrackingChart = new Chart(emotionTracking, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Most Frequent Emotion',
                data: [
                    clientData['emotions'].indexOf(await getavgEmotion("January")),
                    clientData['emotions'].indexOf(await getavgEmotion("February")),
                    clientData['emotions'].indexOf(await getavgEmotion("March")),
                    clientData['emotions'].indexOf(await getavgEmotion("April")),
                    clientData['emotions'].indexOf(await getavgEmotion("May")),
                    clientData['emotions'].indexOf(await getavgEmotion("June")),
                    clientData['emotions'].indexOf(await getavgEmotion("July")),
                    clientData['emotions'].indexOf(await getavgEmotion("August")),
                    clientData['emotions'].indexOf(await getavgEmotion("September")),
                    clientData['emotions'].indexOf(await getavgEmotion("October")),
                    clientData['emotions'].indexOf(await getavgEmotion("November")),
                    clientData['emotions'].indexOf(await getavgEmotion("December"))
                ],
                borderWidth: 1,
                fill: true,
                borderColor: '#358b38',
                tension: 0
            }]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            const emotionLabels = clientData['emotions'];
                            console.log(emotionLabels)
                            return emotionLabels[value] ?? '';
                        }
                    },
                    min: 0,
                    max: 5,
                    stepSize: 1
                }
            }
        }
    });


    FeedBack_Text.innerHTML = clientData['dailyReflection']
}


async function emotionsINIT() {
    await getData(localStorage.getItem("token"))

    loaded = await loadGraphs()
}

emotionsINIT()