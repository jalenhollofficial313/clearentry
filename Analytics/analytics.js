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

// Main logic - Updated to accept year/month parameters
async function analyzeTradesByDay(trades, year = null, month = null) {
    if (year === null || month === null) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
    }
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
                tradesPL.classList.remove("red-text")
            } else if (dailyPL < 0) {
                tradesPL.innerHTML = "-$" + Math.abs(dailyPL)
                tradesPL.classList.add("red-text")
                tradesPL.classList.remove("green-text")
            } else {
                tradesPL.innerHTML = "$" + dailyPL
                tradesPL.classList.remove("green-text", "red-text")
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
                const tradePL = clientData.result['trades'][trade]['PL']
                const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
                const safePL = isNaN(plValue) ? 0 : plValue
                if (EmotionPL[Emotions[emotion]] != null) {
                    EmotionPL[Emotions[emotion]] += safePL
                } else {
                    EmotionPL[Emotions[emotion]] = safePL
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
                const tradePL = clientData.result['trades'][trade]['PL']
                const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
                const safePL = isNaN(plValue) ? 0 : plValue
                if (StrategyPL[Strategies[strategy]] != null) {
                    StrategyPL[Strategies[strategy]] += safePL
                } else {
                    StrategyPL[Strategies[strategy]] = safePL
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

    for (let trade in clientData.result['trades']) {
        tradeAmount += 1
        const tradePL = clientData.result['trades'][trade]['PL']
        const plValue = (tradePL !== undefined && tradePL !== null && tradePL !== '') ? Number(tradePL) : 0
        const safePL = isNaN(plValue) ? 0 : plValue
        totalPL += safePL
        if (safePL > 0 ) {
            totalWinPL += safePL
            wins += 1
        } else if (safePL < 0 ) {
            totalLossPL += safePL
            losses += 1
        }
    }

    // Calculate averages safely
    avgWin = wins > 0 ? totalWinPL / wins : 0
    avgLoss = losses > 0 ? Math.abs(totalLossPL / losses) : 0

    let WinRate = tradeAmount > 0 ? Math.floor((wins / tradeAmount) * 100) : 0
    let LossRate = tradeAmount > 0 ? (losses / tradeAmount) : 0
    
    // Fix Profit Factor calculation
    // Profit Factor = (sum of profits from winning trades) / (absolute sum of losses from losing trades)
    let ProfitFactor;
    if (Math.abs(totalLossPL) === 0) {
        // No losing trades but there are winners
        if (totalWinPL > 0) {
            ProfitFactor = "∞"; // Infinity or max cap
        } else {
            ProfitFactor = 0; // No winners
        }
    } else {
        ProfitFactor = roundTo(totalWinPL / Math.abs(totalLossPL), 2);
    }
    
    // Fix Expectancy calculation
    // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
    let Expectancy;
    if (tradeAmount === 0) {
        Expectancy = 0;
    } else {
        Expectancy = roundTo(((WinRate/100) * avgWin) - ((LossRate) * avgLoss), 2);
    }
    let EmotionalConsistency =  Math.floor((mostEmotionAmount / totalemotionAmounts) * 100)

    const statText = document.querySelectorAll(".MainFrame_Frame_Frame_TopStats_Stat_text")
    const statText2 = document.querySelectorAll(".MainFrame_Frame_Frame_MainStats_StatsFrame_Stat_Text")
    if (totalPL > 0) {
        statText[0].innerHTML = "+$" + totalPL.toLocaleString()
        statText[0].classList.add("green-text")
    } else if (totalPL < 0) {
        statText[0].innerHTML = "-$" + Math.abs(totalPL).toLocaleString()
        statText[0].classList.add("red-text")
    } else {
        statText[0].innerHTML = "$" + totalPL.toLocaleString()
    }
    statText[1].innerHTML = WinRate + "%"
    statText[2].innerHTML = ProfitFactor === "∞" ? "∞" : ProfitFactor
    if (Expectancy > 0) {
        statText[3].innerHTML = "+$" + Expectancy
        statText[3].classList.add("green-text")
        statText[3].classList.remove("red-text")
    } else if (Expectancy < 0) {
        statText[3].innerHTML = "-$" + Math.abs(Expectancy)
        statText[3].classList.add("red-text")
        statText[3].classList.remove("green-text")
    } else {
        statText[3].innerHTML = "$" + Expectancy
        statText[3].classList.remove("green-text", "red-text")
    }
    statText2[0].innerHTML = mostEmotion
    statText2[1].innerHTML = mostProfitableEmotion
    statText2[2].innerHTML = EmotionalConsistency + "%" 
    statText2[3].innerHTML = mostProfitableStrategy || "N/A"
}

// Calendar state
let currentCalendarDate = new Date();

// Format month name
function getMonthName(monthIndex) {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return months[monthIndex];
}

// Load calendar for specific month/year
async function loadDate(year = null, month = null) {
    const cal = document.querySelector(".MainFrame_Frame_Frame_MainStats_Calender");
    const titleEl = document.querySelector(".MainFrame_Frame_Frame_MainStats_CalenderFrame_Title");

    // Use provided date or current calendar date
    if (year === null || month === null) {
        year = currentCalendarDate.getFullYear();
        month = currentCalendarDate.getMonth();
    } else {
        currentCalendarDate = new Date(year, month, 1);
    }

    // Update title
    if (titleEl) {
        titleEl.textContent = `${getMonthName(month)} ${year}`;
    }

    // Get the total number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Clear existing HTML
    cal.innerHTML = "";

    // Loop through and create a div for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const num = String(d).padStart(2, "0");

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

    // Re-analyze trades for the new month
    if (tradeData) {
        analyzeTradesByDay(tradeData, year, month);
    }
}


document.addEventListener("DOMContentLoaded", () => {
  const barIcon = document.querySelector("#bar-icon");
  const headFrame = document.querySelector(".MainFrame_HeadFrame");
  
  // Handle clicks on headframe - check if it's specifically the bar-icon
  if (headFrame) {
    headFrame.addEventListener("click", (e) => {
      // Check if the click target is the bar-icon or inside it
      const clickedBarIcon = e.target.closest("#bar-icon");
      
      if (clickedBarIcon) {
        // Click was on the bar-icon, toggle sidebar
        e.stopPropagation();
        console.log("Check")
        const sidebar = document.querySelector("#sidebar");
        if (sidebar) {
          sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
        }
      }
      // If click is not on bar-icon, do nothing (prevents accidental triggers)
    });
  }
  
  // Also add direct handler to bar-icon as backup
  if (barIcon) {
    barIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      console.log("Check")
      const sidebar = document.querySelector("#sidebar");
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
      }
    });
  }
});


async function getTradesOrder(table) {

    let tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b['date'] - a['date']);
    console.log(tableArray)
    return tableArray;
}





// Check membership and setup paywalls
function setupMembershipGating() {
    const membership = clientData.result['membership'];
    const isPro = membership && membership.toLowerCase() === 'pro';
    
    // Calendar paywall
    const calendarPaywall = document.getElementById('calendar-paywall');
    if (calendarPaywall) {
        calendarPaywall.style.display = isPro ? 'none' : 'flex';
    }
    
    // Time range selector gating
    const weekButton = document.getElementById('range-week');
    const monthButton = document.getElementById('range-month');
    const yearButton = document.getElementById('range-year');
    
    if (!isPro) {
        // Standard members: only Week is available
        if (monthButton) {
            monthButton.classList.add('range-button-locked');
            monthButton.querySelector('.range-lock-icon').style.display = 'inline-block';
        }
        if (yearButton) {
            yearButton.classList.add('range-button-locked');
            yearButton.querySelector('.range-lock-icon').style.display = 'inline-block';
        }
        
        // Add click handlers for locked buttons
        if (monthButton) {
            monthButton.addEventListener('click', () => {
                window.location.href = '../Home/index.html#pricing';
            });
        }
        if (yearButton) {
            yearButton.addEventListener('click', () => {
                window.location.href = '../Home/index.html#pricing';
            });
        }
    }
}

// Time range selector functionality
let currentTimeRange = 'week';

function setupTimeRangeSelector() {
    const weekButton = document.getElementById('range-week');
    const monthButton = document.getElementById('range-month');
    const yearButton = document.getElementById('range-year');
    
    const membership = clientData.result['membership'];
    const isPro = membership && membership.toLowerCase() === 'pro';
    
    function setActiveRange(range) {
        // Remove active from all
        [weekButton, monthButton, yearButton].forEach(btn => {
            if (btn) btn.classList.remove('range-button-active');
        });
        
        // Add active to selected
        if (range === 'week' && weekButton) {
            weekButton.classList.add('range-button-active');
        } else if (range === 'month' && monthButton && isPro) {
            monthButton.classList.add('range-button-active');
        } else if (range === 'year' && yearButton && isPro) {
            yearButton.classList.add('range-button-active');
        }
        
        currentTimeRange = range;
        // TODO: Filter data based on time range
    }
    
    if (weekButton) {
        weekButton.addEventListener('click', () => setActiveRange('week'));
    }
    if (monthButton && isPro) {
        monthButton.addEventListener('click', () => setActiveRange('month'));
    }
    if (yearButton && isPro) {
        yearButton.addEventListener('click', () => setActiveRange('year'));
    }
}

// Calendar navigation
function setupCalendarNavigation() {
    const prevButton = document.getElementById('calendar-prev');
    const nextButton = document.getElementById('calendar-next');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            loadDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            loadDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        });
    }
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", async function() {
    await getClientData()
    await sleep(100)

    // Initialize calendar with current month
    const now = new Date();
    currentCalendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
    loadDate(now.getFullYear(), now.getMonth())
    
    tradeData = await getTradesOrder(clientData.result['trades'])
    analyzeTradesByDay(tradeData, now.getFullYear(), now.getMonth())
    loadData()
    
    // Setup membership gating
    setupMembershipGating()
    
    // Setup time range selector
    setupTimeRangeSelector()
    
    // Setup calendar navigation
    setupCalendarNavigation()
    
    // Recreate icons after DOM updates
    lucide.createIcons();
});
