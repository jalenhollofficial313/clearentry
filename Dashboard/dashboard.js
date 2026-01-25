
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

// Extension notification (show once)
function extension_Notice() {
    const EXTENSION_NOTICE_KEY = "extensionNoticeDismissed";
    const extensionNotification = document.getElementById("extension-notification");
    const extensionClose = document.getElementById("extension-notification-close");

    extensionNotification.style.display = "block";

    if (extensionClose) {
        extensionClose.addEventListener("click", () => {
            if (extensionNotification) {
                extensionNotification.classList.add("hide");
                setTimeout(() => {
                    extensionNotification.style.display = "none";
                    extensionNotification.classList.remove("hide");
                }, 300);
            }
        });
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resolveTradeStrategies(strategyField, strategies = {}) {
    if (!strategyField || strategyField === "") {
        return [];
    }

    const values = Array.isArray(strategyField) ? strategyField : [strategyField];
    return values
        .map(value => {
            const strategy = strategies[value];
            return strategy && strategy.name ? strategy.name : value;
        })
        .filter(value => value);
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
            const tradePL = dataObj[trade]['PL']
            const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
            if (!isNaN(plValue)) {
                totalPL += plValue
            }
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
        const tradePL = clientData.result['trades'][x]['PL']
        console.log(tradePL)
        const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
        if (isNaN(plValue)) {
            continue // Skip invalid PL values
        }
        totalBalance += plValue
        if (plValue > 0) {
            totalProfit += plValue
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
    console.log(trades)
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
        const strategies = clientData?.result?.strategies || {}
        const resolvedStrategies = resolveTradeStrategies(trades[trade]["strategy"], strategies)
        strategyText.textContent = resolvedStrategies.join(", ")
        strategyText.classList.add("inter-text")
        strategyText.classList.add("trade-text")
        strategyText.classList.add("truncate")
        tradediv.appendChild(strategyText)

        const winlosstext = document.createElement("p")
        const tradePLWin = trades[trade]["PL"]
        const plValueWin = (tradePLWin !== undefined && tradePLWin !== null && tradePLWin !== '') ? Number(tradePLWin) : 0
        const safePLWin = isNaN(plValueWin) ? 0 : plValueWin
        if (safePLWin > 0) {
            winlosstext.classList.add("green-text")
            winlosstext.innerHTML = "win"
        } else if (safePLWin < 0) {
            winlosstext.classList.add("red-text")
            winlosstext.innerHTML = "loss"
        } else {
            winlosstext.innerHTML = "—"
        }
        winlosstext.classList.add("inter-text")
        winlosstext.classList.add("trade-text")
        tradediv.appendChild(winlosstext)

        const pltext = document.createElement("p")
        const tradePLDisplay = trades[trade]["PL"]
        const plValueDisplay = (tradePLDisplay !== undefined && tradePLDisplay !== null && tradePLDisplay !== '') ? Number(tradePLDisplay) : 0
        const safePLDisplay = isNaN(plValueDisplay) ? 0 : plValueDisplay
        if (safePLDisplay > 0) {
            pltext.innerHTML = "+$" + safePLDisplay.toLocaleString()
            pltext.classList.add("green-text")
        } else if (safePLDisplay < 0) {
            pltext.innerHTML = "-$" + Math.abs(safePLDisplay).toLocaleString()
            pltext.classList.add("red-text")
        } else {
            pltext.innerHTML = "$0"
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

        tradediv.appendChild(emotiontext)

        document.querySelector("#trades_Div").appendChild(tradediv)
    }


    document.querySelector("#emotion_Text").innerHTML = Math.floor(mostEmotionAmount/totalemotionAmounts * 10) + "/10";
    document.querySelector("#emotion_Bar").style.width = Math.floor(mostEmotionAmount/totalemotionAmounts * 100) + '%';
    document.querySelector("#total_Balance").innerHTML = "$" + totalBalance.toLocaleString()
    if (totalProfit > -1) {
        document.querySelector("#total_Profit").innerHTML = "+$" + totalProfit.toLocaleString()
    } else {
        document.querySelector("#total_Profit").innerHTML = "-$" + Math.abs(totalProfit).toLocaleString()
    }


}


async function loadGraphs(params) {


    let totalWins = 0
    let totalLosses = 0

    let totalProfit = 0
    let totalLoss = 0

    for (let x in clientData.result['trades']) {
        const tradePL = clientData.result['trades'][x]['PL']
        const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
        if (isNaN(plValue)) {
            continue // Skip invalid PL values
        }
        if (plValue > 0) {
            totalWins++
            totalProfit += plValue
        } else if (plValue < 0) {
            totalLosses++
            totalLoss += Math.abs(plValue)
        }
    }

    var options = {
      chart: { type: 'donut', height:"100%", width:"100%" },
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
            fontSize: '10px',
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
              show: false,
              name: {
                show: false,
                fontSize: '36px',
                color: '#ffffff',
              },
              value: {
                show: false,
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
      chart: { type: 'donut', height:"100%", width:"100%" },
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
              show: false,
              name: {
                show: false,
                fontSize: '36px',
                color: '#ffffff',
              },
              value: {
                show: false,
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
        height: "80%",
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


document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-icon").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
});

async function loadingFrame(ms, text1, text2) {
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");

    loadedFrame.style.display = "none"
    loadingDiv.style.display = "flex"
    loadingDiv.querySelector("p").innerHTML = text1
    loadingFrame.style.display = "block"
    await sleep(100)
    loadingFrame.style.transform = "translateY(0px)"
    await sleep(ms)
    loadedFrame.style.display = "flex"
    loadingDiv.style.display = "none"
    loadedFrame.querySelector("p").innerHTML = text2
    await sleep(1000)
    loadingFrame.style.transform = "translateY(200px)"
    await sleep(700)
    loadingFrame.style.display = "block"
}

async function dashboardINIT() {
    // Show full page loader
    document.getElementById("dashboard-full-loader").style.display = "flex";
    document.getElementById("subscription-gate").style.display = "none";
    document.querySelector(".MainFrame").style.display = "none";
    
    if (localStorage.getItem("firstsign") == "true") {
        loadingFrame(5100, "Loading Data.", "Data Loaded.")
        await sleep(5000)
        await getClientData()
        await sleep(100)
        console.log("Check")
        localStorage.removeItem("firstsign")
    } else {
        await getClientData()
        await sleep(100)
    }

    if (localStorage.getItem("pendingProCheckout") === "true") {
        const loaderText = document.querySelector("#dashboard-full-loader .loader-text");
        if (loaderText) {
            loaderText.textContent = "Finalizing your subscription...";
        }
        const synced = await waitForProMembershipSync();
        if (!synced) {
            return;
        }
    }
    
    // Hide full page loader
    document.getElementById("dashboard-full-loader").style.display = "none";
    
    extension_Notice();
    const walkthroughShown = maybeShowPostSignupWalkthrough();
    if (walkthroughShown) {
        return;
    }

    // Check if first time user
    if (clientData && clientData.result && clientData.result.isFirstTimeUser === true) {
        const membership = clientData?.result?.membership?.toLowerCase();
        if (membership === "pro") {
            // Hide dashboard content
            document.querySelector(".MainFrame").style.display = "none";
            // Show onboarding wizard
            initOnboarding();
        } else {
            checkAndShowSubscriptionGate();
        }
    } else {
        // Check membership and show subscription gate if Standard
        checkAndShowSubscriptionGate();
    }
}

async function waitForProMembershipSync() {
    const maxAttempts = 45;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const membership = clientData?.result?.membership?.toLowerCase();
        if (membership === "pro") {
            localStorage.removeItem("pendingProCheckout");
            return true;
        }

        await sleep(2000);
        await getClientData();
    }

    return false;
}

function checkAndShowSubscriptionGate() {
    const membership = clientData?.result?.membership;
    if (!membership) {
        document.getElementById("subscription-gate").style.display = "none";
        document.querySelector(".MainFrame").style.display = "block";
        return;
    }

    const normalizedMembership = membership.toLowerCase();
    const isStandard = normalizedMembership === "standard";
    const isPro = normalizedMembership === "pro";
    
    if (isStandard) {
        // Show subscription gate
        document.getElementById("subscription-gate").style.display = "flex";
        document.querySelector(".MainFrame").style.display = "none";
        lucide.createIcons();
        
        // Setup CTA button
        const ctaButton = document.getElementById("subscription-gate-cta");
        if (ctaButton) {
            ctaButton.addEventListener("click", function() {
                window.location.href = "../Home/index.html#pricing";
            });
        }
    } else if (isPro) {
        // Hide gate and show dashboard
        document.getElementById("subscription-gate").style.display = "none";
        document.querySelector(".MainFrame").style.display = "block";
        loadStats();
        loadGraphs();
    } else {
        document.getElementById("subscription-gate").style.display = "none";
        document.querySelector(".MainFrame").style.display = "block";
    }
}

function maybeShowPostSignupWalkthrough() {
    const walkthroughModal = document.getElementById("post-signup-walkthrough");
    if (!walkthroughModal || !clientData?.result) {
        return false;
    }

    const isFirstTimeUser = clientData.result.isFirstTimeUser === true;
    const cameFromSignup = localStorage.getItem("firstsign") === "true";
    if (isFirstTimeUser || cameFromSignup) {
        showPostSignupWalkthrough();
        return true;
    }

    return false;
}

async function startProCheckout(button) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../Home/login.html";
        return;
    }

    const originalText = button ? button.textContent : "";
    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Processing...";
        }

        const response = await fetch("https://create-checkout-session-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
        });

        const checkoutUrl = await response.text();
        if (response.ok && checkoutUrl) {
            localStorage.setItem("pendingProCheckout", "true");
            window.location.href = checkoutUrl;
        } else {
            console.error("Failed to create checkout session:", checkoutUrl);
            alert("Failed to start checkout. Please try again.");
        }
    } catch (error) {
        console.error("Error creating checkout session:", error);
        alert("An error occurred. Please try again.");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

async function markPostSignupWalkthroughComplete() {
    try {
        const token = localStorage.getItem("token") || "";
        if (!token) {
            return;
        }
        await fetch("https://complete-post-signup-walkthrough-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
        });
    } catch (error) {
        console.warn("Failed to mark walkthrough complete:", error);
    }
}

function showPostSignupWalkthrough() {
    const walkthroughModal = document.getElementById("post-signup-walkthrough");
    const closeButton = document.getElementById("post-signup-close");
    const prevButton = document.getElementById("post-signup-prev");
    const nextButton = document.getElementById("post-signup-next");
    const ctaButton = document.getElementById("post-signup-cta");
    const progressDots = walkthroughModal.querySelectorAll(".quick-tour-progress-dot");
    const slides = walkthroughModal.querySelectorAll(".quick-tour-slide");

    let currentSlide = 1;
    const totalSlides = slides.length;

    function updateSlide() {
        slides.forEach((slide, index) => {
            if (index + 1 === currentSlide) {
                slide.classList.add("active");
            } else {
                slide.classList.remove("active");
            }
        });

        progressDots.forEach((dot, index) => {
            if (index + 1 === currentSlide) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });

        if (prevButton) {
            prevButton.disabled = currentSlide === 1;
        }
        if (nextButton) {
            nextButton.style.display = currentSlide === totalSlides ? "none" : "inline-flex";
        }

        slides.forEach((slide, index) => {
            const video = slide.querySelector(".walkthrough-video");
            if (!video) {
                return;
            }

            if (index + 1 === currentSlide) {
                if (!video.getAttribute("src") && video.dataset.src) {
                    video.setAttribute("src", video.dataset.src);
                    video.load();
                }
                video.currentTime = 0;
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {});
                }
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });

        lucide.createIcons();
    }

    function nextSlide() {
        if (currentSlide < totalSlides) {
            currentSlide += 1;
            updateSlide();
        }
    }

    function prevSlide() {
        if (currentSlide > 1) {
            currentSlide -= 1;
            updateSlide();
        }
    }

    function closeWalkthrough() {
        walkthroughModal.classList.remove("show");
    }

    async function finishWalkthrough() {
        const membership = clientData?.result?.membership?.toLowerCase();
        if (membership !== "pro") {
            closeWalkthrough();
            checkAndShowSubscriptionGate();
            return;
        }

        await markPostSignupWalkthroughComplete();
        closeWalkthrough();
        if (clientData?.result?.isFirstTimeUser === true) {
            initOnboarding();
        } else {
            checkAndShowSubscriptionGate();
        }
    }

    walkthroughModal.classList.add("show");
    document.getElementById("subscription-gate").style.display = "none";
    document.querySelector(".MainFrame").style.display = "none";

    updateSlide();

    if (nextButton) {
        nextButton.addEventListener("click", nextSlide);
    }
    if (prevButton) {
        prevButton.addEventListener("click", prevSlide);
    }
    progressDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            currentSlide = index + 1;
            updateSlide();
        });
    });
    if (ctaButton) {
        ctaButton.addEventListener("click", () => startProCheckout(ctaButton));
    }
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            closeWalkthrough();
            checkAndShowSubscriptionGate();
        });
    }
}



dashboardINIT();
