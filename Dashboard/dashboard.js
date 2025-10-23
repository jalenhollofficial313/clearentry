
const winRate = document.getElementById("winRate_Text");
const plTotal = document.getElementById("plTotal_Text");
const avgHoldTime = document.getElementById("avgHoldTime_Text");
const avgEmotion = document.getElementById("avgEmotion_Text")

const emotionRate = document.getElementById('emotionRate');
const PLChart = document.getElementById("PLChart");
const WLRChart = document.getElementById("WLRChart");
const plCurve = document.getElementById("plCurve")

const TradeFrame = document.getElementById("TradeFrame")
const DailyReflectionText = document.getElementById("DailyReflectionText")

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


function getMonthUnixRange(monthName) {
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth(); // 0 for Jan, 1 for Feb...

    const now = new Date();
    const year = now.getFullYear();

    const start = new Date(year, monthIndex, 1, 0, 0, 0).getTime() / 1000;
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime() / 1000;

    return { start, end };
}

async function getTradesByWeekday(dataObj, weekdayKey,) {
    const weekdays = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
    };

    const now = new Date();

    // Get Monday of this week
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay() + 1);
    firstDay.setHours(0, 0, 0, 0);

    // Get Sunday of this week
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);

    const targetDay = weekdays[weekdayKey.toLowerCase()];
    if (targetDay === undefined) {
        throw new Error(`Invalid weekday: ${weekdayKey}`);
    }

    const result = {};


    for (const trade in dataObj) {
        if (dataObj[trade].hasOwnProperty('date')) {
            const item = dataObj[trade];
            const itemDate = new Date(dataObj[trade]['date'] * 1000);
            if (itemDate.getDay() === targetDay && itemDate >= firstDay && itemDate <= lastDay) {
                result[trade] = item;
            }
        }
    }

    let totalPL = 0

    for (const trade in result) {
        if (dataObj[trade]) {
            totalPL += dataObj[trade]['PL']
        }
    }


    return totalPL;
}

async function getTradesByWeek(dataObj) {

    const now = new Date();

    // Get Monday of this week
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay() + 1);
    firstDay.setHours(0, 0, 0, 0);

    // Get Sunday of this week
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);


    const result = {};


    for (const trade in dataObj) {
        if (dataObj[trade].hasOwnProperty('date')) {
            const item = dataObj[trade];
            const itemDate = new Date(dataObj[trade]['date'] * 1000);
            if (itemDate >= firstDay && itemDate <= lastDay) {
                result[trade] = item;
            }
        }
    }


    return result;
}




async function loadStats() {
    let totalBalance = 0
    let totalProfit = 0

    document.querySelector("#user-Name").innerHTML =  "Welcome Back, " + clientData.result['name']

    for (let x in clientData.result['trades']) {
        totalBalance += clientData.result['trades'][x]['PL']
        if (clientData.result['trades'][x]['PL'] > 0) {
            totalProfit += clientData.result['trades'][x]['PL']
        }
    }


    let mostEmotionAmount = 0
    let mostEmotion = "None"

    let totalemotionAmounts = 0
    let Emotions = clientData.result["emotions"]
    
    for (let emotion in Emotions) {
        let emotionAmount = 0
        for (let trade in clientData.result['trades']) {
            if (clientData.result['trades'][trade]['emotion'] == Emotions[emotion]) {
                totalemotionAmounts += 1
                emotionAmount += 1
            }
        }
        if (emotionAmount > mostEmotionAmount) {
            mostEmotionAmount = emotionAmount
            mostEmotion = emotion
        }
    }

    let trades = await getTradesByWeek(clientData.result['trades'])

    for (const trade in trades) {
        const tradediv = document.createElement("div")
        tradediv.classList.add("flex-box")
        tradediv.classList.add("trade-frame")

        const datetext = document.createElement("p")
        datetext.innerHTML = await convertUnixToMonthDay(trades[trade]['date'])
        datetext.classList.add("inter-text")
        datetext.classList.add("trade-text")
        tradediv.appendChild(datetext)

        const symboltext = document.createElement("p")
        symboltext.innerHTML = trades[trade]["symbol"]
        symboltext.classList.add("inter-text")
        symboltext.classList.add("trade-text")
        tradediv.appendChild(symboltext)

        const strategyText = document.createElement("p")
        strategyText.innerHTML = trades[trade]["strategy"]
        strategyText.classList.add("inter-text")
        strategyText.classList.add("trade-text")
        strategyText.classList.add("truncate")
        tradediv.appendChild(strategyText)

        const winlosstext = document.createElement("p")
        if (trades[trade]['PL'] > 0) {
            winlosstext.classList.add("green-text")
            winlosstext.innerHTML = "win"
        } else {
            winlosstext.classList.add("red-text")
            winlosstext.innerHTML = "loss"
        }
        winlosstext.classList.add("inter-text")
        winlosstext.classList.add("trade-text")
        tradediv.appendChild(winlosstext)

        const pltext = document.createElement("p")
        if (trades[trade]['PL'] > 0) {
            pltext.innerHTML = "+$" + trades[trade]["PL"]
            pltext.classList.add("green-text")
        } else {
            pltext.innerHTML = "-$" + Math.abs(trades[trade]["PL"])
            pltext.classList.add("red-text")
        }

        pltext.classList.add("inter-text")
        pltext.classList.add("trade-text")
        tradediv.appendChild(pltext)

        const notesText = document.createElement("p")
        notesText.innerHTML = trades[trade]["notes"]
        notesText.classList.add("inter-text")
        notesText.classList.add("trade-text")
        notesText.classList.add("example-text")
        notesText.classList.add("truncate")
        tradediv.appendChild(notesText)

        const emotiontext = document.createElement("p")
        emotiontext.innerHTML = trades[trade]["emotion"]
        emotiontext.classList.add("inter-text")
        emotiontext.classList.add("trade-text")
        emotiontext.classList.add("truncate")
        tradediv.appendChild(emotiontext)

        document.querySelector("#trades_Div").appendChild(tradediv)
    }


    document.querySelector("#emotion_Text").innerHTML = Math.floor(mostEmotionAmount/totalemotionAmounts * 10) + "/10";
    document.querySelector("#emotion_Bar").style.width = Math.floor(mostEmotionAmount/totalemotionAmounts * 100) + '%';
    document.querySelector("#total_Balance").innerHTML = "$" + totalBalance
    if (totalProfit > -1) {
        document.querySelector("#total_Profit").innerHTML = "+$" + totalProfit
    } else {
        document.querySelector("#total_Profit").innerHTML = "-$" + Math.abs(totalProfit)
    }


}


async function loadGraphs(params) {


    let totalWins = 0
    let totalLosses = 0

    let totalProfit = 0
    let totalLoss = 0

    for (let x in clientData.result['trades']) {
        if (clientData.result['trades'][x]['PL'] > 0) {
            totalWins++
            totalProfit += clientData.result['trades'][x]['PL']
        } else {
            totalLosses++
            totalLoss += (clientData.result['trades'][x]['PL'] * -1)
        }
    }

    var options = {
      chart: { type: 'donut', height:"80%", width:"65%" },
      series: [totalWins, totalLosses,],
      labels: ['Profitable', 'Losing'],

      colors: [
      '#00ff99', // Profitable (green)
      '#ff4747', // Losing (red)
    ],

      dataLabels: {
          enabled: true,
          enabledOnSeries: undefined,
          textAnchor: 'middle',
          distributed: false,
          offsetX: 0,
          offsetY: 0,
          style: {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: undefined
          },
          background: {
            enabled: true,
            foreColor: '#fff',
          },
          dropShadow: {
              enabled: false,
              top: 1,
              left: 1,
              blur: 1,
              color: '#000',
              opacity: 0.45
          }
      },
      legend: {
        show: false,
      },
      stroke: {
        show: false
      },

      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '36px',
                color: '#ffffff',
              },
              value: {
                show: true,
                fontSize: '25px',
                fontWeight: '700',
                color: '#ffffff',

              },
              total: {
                show: true,
                showAlways: true,
                label: 'Win Rate',
                fontSize: '15px',
                color: 'gray',
                formatter: function(value) {
                  return value.config.series[0] + "%";
                }
              },
            },
          },
        },
      },
    };

    var options2 = {
      chart: { type: 'donut', height:"80%", width:"65%" },
      series: [totalProfit, totalLoss],
      labels: ['Profitable', 'Losing'],

      colors: [
        '#00ff99', // Profitable (green)
        '#ff4747', // Losing (red)
      ],

      dataLabels: {
          enabled: true,
          enabledOnSeries: undefined,
          textAnchor: 'middle',
          distributed: false,
          offsetX: 0,
          offsetY: 0,
          style: {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: undefined
          },
          background: {
            enabled: true,
            foreColor: '#fff',
          },
          formatter: function (val, opts) {
            const seriesIndex = opts.seriesIndex;
            const value = opts.w.config.series[seriesIndex];
            if (seriesIndex == 0) {
              return "+$" + value.toLocaleString(); 
            } else {
              return "-$" + value.toLocaleString(); 
            }
            return "$" + value.toLocaleString(); 
          },
          dropShadow: {
              enabled: false,
              top: 1,
              left: 1,
              blur: 1,
              color: '#000',
              opacity: 0.45
          }
      },
      legend: {
        show: false,
      },
      stroke: {
        show: false
      },

      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '36px',
                color: '#ffffff',
              },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',

              },
              total: {
                show: true,
                showAlways: true,
                label: 'Profit',
                fontSize: '15px',
                color: 'gray',
                formatter: function(value) {
                  return "+$" + value.config.series[0];
                }
              },
            },
          },
        },
      },
    };

    var options3 = {
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        background: 'transparent' 
      },
      series: [{
        name: 'P&L',
        data: [await getTradesByWeekday(clientData.result['trades'], 'monday'), await getTradesByWeekday(clientData.result['trades'], 'tuesday'), await getTradesByWeekday(clientData.result['trades'], 'wednesday'), await getTradesByWeekday(clientData.result['trades'], 'thursday'), await getTradesByWeekday(clientData.result['trades'], 'friday'), await getTradesByWeekday(clientData.result['trades'], 'saturday'), await getTradesByWeekday(clientData.result['trades'], 'sunday')] // replace with your own weekly values
      }],
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#A0A4AD' } }
      },
      yaxis: {
        labels: {
          formatter: (v) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(v),
          style: { colors: '#A0A4AD' }
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.3,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      colors: ['#00E396'],
      grid: {
        borderColor: 'rgba(255,255,255,0.06)',
        strokeDashArray: 3,
        padding: { left: 10, right: 10 }
      },
      markers: { size: 3, strokeWidth: 0 },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (v) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(v)
        }
      },
      theme: { mode: 'dark' },
      annotations: {
        yaxis: [{
          y: 0,
          borderColor: 'rgba(255,255,255,0.12)',
          strokeDashArray: 4,
          label: {
            text: 'Break-even',
            style: { background: 'transparent', color: '#A0A4AD' }
          }
        }]
      }
    };


    var chart = new ApexCharts(document.querySelector("#WLRChart"), options);
    var chart2 = new ApexCharts(document.querySelector("#PLChart"), options2);


    var chart3 = new ApexCharts(document.querySelector("#weekPL"), options3);



    await chart.render();
    await chart2.render();
    await chart3.render();

    return true
}

async function dashboardINIT() {
    await getClientData()
    await sleep(100)
    
    loadStats()
    loadGraphs()
}


dashboardINIT();
