const entriesFrame = document.getElementById("EntriesFrame");

const tradeExample = document.getElementById("Clone-Entry")
const EntriesFrame = document.getElementById("EntriesFrame")

// Filter elements
const filterType = document.getElementById("filter-type");
const filterResult = document.getElementById("filter-result");
const filterStatus = document.getElementById("filter-status");
const filterStrategy = document.getElementById("filter-strategy");
const filterEmotion = document.getElementById("filter-emotion");
const clearFiltersButton = document.getElementById("clear-filters");

// Store all trades for filtering
let allTrades = [];
let strategyLookup = {};

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

function resolveTradeStrategies(strategyField) {
  if (!strategyField || strategyField === "") {
    return [];
  }

  const values = Array.isArray(strategyField) ? strategyField : [strategyField];
  return values
    .map(value => {
      const strategy = strategyLookup[value];
      return strategy && strategy.name ? strategy.name : value;
    })
    .filter(value => value);
}

let client_server_debounce = false
async function loadingFrame(ms, text1, text2) {
    client_server_debounce = true
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");

    loadedFrame.style.display = "none"
    loadingDiv.style.display = "flex"
    loadingDiv.querySelector("p").innerHTML = text1
    loadingFrame.style.display = "block"
    await sleep(100)
    loadingFrame.style.transform = "translateY(0px)"
    while (client_server_debounce == true) {
        await sleep(100)
    }
    loadedFrame.style.display = "flex"
    loadingDiv.style.display = "none"
    loadedFrame.querySelector("p").innerHTML = text2
    await sleep(1000)
    loadingFrame.style.transform = "translateY(200px)"
    await sleep(700)
    loadingFrame.style.display = "block"
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

function populateFilterOptions(trades) {
  // Get unique strategies and emotions
  const strategies = new Set();
  const emotions = new Set();
  
  trades.forEach(trade => {
    if (trade.strategy && trade.strategy !== "") {
      resolveTradeStrategies(trade.strategy).forEach(s => strategies.add(s));
    }
    if (trade.emotion && trade.emotion !== "") {
      emotions.add(trade.emotion);
    }
  });
  
  // Populate strategy dropdown
  filterStrategy.innerHTML = '<option value="all">All Strategies</option>';
  Array.from(strategies).sort().forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy;
    option.textContent = strategy;
    filterStrategy.appendChild(option);
  });
  
  // Populate emotion dropdown
  filterEmotion.innerHTML = '<option value="all">All Emotions</option>';
  Array.from(emotions).sort().forEach(emotion => {
    const option = document.createElement('option');
    option.value = emotion;
    option.textContent = emotion;
    filterEmotion.appendChild(option);
  });
}

function filterTrades(trades) {
  return trades.filter(trade => {
    // Filter by type
    if (filterType.value !== "all") {
      if (trade.type !== filterType.value) {
        return false;
      }
    }
    
    // Filter by result (win/loss)
    if (filterResult.value !== "all") {
      const pl = Number(trade.PL) || 0;
      if (filterResult.value === "win" && pl <= 0) {
        return false;
      }
      if (filterResult.value === "loss" && pl >= 0) {
        return false;
      }
    }
    
    // Filter by status (open/closed)
    if (filterStatus.value !== "all") {
      const isOpen = trade.open === true || trade.open === "true";
      if (filterStatus.value === "open" && !isOpen) {
        return false;
      }
      if (filterStatus.value === "closed" && isOpen) {
        return false;
      }
    }
    
    // Filter by strategy
    if (filterStrategy.value !== "all") {
      const resolvedStrategies = resolveTradeStrategies(trade.strategy);
      if (resolvedStrategies.length === 0 || !resolvedStrategies.includes(filterStrategy.value)) {
        return false;
      }
    }
    
    // Filter by emotion
    if (filterEmotion.value !== "all") {
      if (trade.emotion !== filterEmotion.value) {
        return false;
      }
    }
    
    return true;
  });
}

function calculateOptimalWidth() {
  const entryWidth = 350; // Fixed width of each entry
  const gap = 20; // Gap between entries
  const containerPadding = 10; // Left + right padding
  
  // Get the actual MainFrame width (accounts for sidebar)
  const mainFrame = document.querySelector('.MainFrame');
  const maxContainerWidth = mainFrame ? mainFrame.offsetWidth * 0.95 : window.innerWidth * 0.95;
  
  // Calculate how many entries can fit per row
  const availableWidth = maxContainerWidth - containerPadding;
  const entriesPerRow = Math.floor((availableWidth + gap) / (entryWidth + gap));
  
  // Calculate optimal width: exactly fit N entries
  if (entriesPerRow > 0) {
    const optimalWidth = (entriesPerRow * entryWidth) + ((entriesPerRow - 1) * gap) + containerPadding;
    return Math.min(optimalWidth, maxContainerWidth);
  }
  
  return maxContainerWidth;
}

function renderTrades(trades) {
  // Clear existing entries (except the clone)
  const existingEntries = EntriesFrame.querySelectorAll('.MainFrame_EntriesFrame_Entries_Entry:not(#Clone-Entry)');
  console.log(existingEntries)
  existingEntries.forEach(entry => entry.remove());
  
  // Calculate and set optimal width
  const optimalWidth = calculateOptimalWidth();
  EntriesFrame.style.width = `${optimalWidth}px`;
  
  const frag = document.createDocumentFragment();
  
  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    const clone = tradeExample.cloneNode(true);
    clone.style.display = "block";
    clone.id = ""

    // Fill inside the clone (not the whole document)
    const strategyText = resolveTradeStrategies(t.strategy).join(", ");
    clone.querySelector(".strategy-text").textContent = strategyText;
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

    // Rank or Open/Closed
    const entryEl = clone.querySelector(".entry-type");
    const isOpen = t.open === true || t.open === "true";
    
    // Check if trade has a rank
    if (t.Rank && t.Rank !== "" && !isOpen) {
        // Show rank for closed trades
        entryEl.textContent = t.Rank;
        entryEl.classList.remove("opened-entry", "closed-entry");
        entryEl.classList.add("entry-rank", `entry-rank-${t.Rank}`);
    } else {
        // Show Open/Closed for trades without rank or open trades
        entryEl.textContent = isOpen ? "Open" : "Closed";
        entryEl.classList.toggle("opened-entry", isOpen);
        entryEl.classList.toggle("closed-entry", !isOpen);
        entryEl.classList.remove("entry-rank", "entry-rank-Terrible", "entry-rank-Bad", "entry-rank-Mediocre", "entry-rank-Good", "entry-rank-Great", "entry-rank-Excellent");
    }

    const closeButton = clone.querySelector(".trade-close-button");
    closeButton.style.display = t.open == true ? "block" : "none"


    const viewButton = clone.querySelector(".trade-view-button");
    viewButton.addEventListener('click', async function() {
        localStorage.setItem("tradeView", t.id)
        window.location.href = "../TradeLogging/tradelogging.html"
    })

    const deleteButton = clone.querySelector(".trade-delete-button");
    deleteButton.addEventListener('click', async function() {
        loadingFrame(0, "Deleting Trade...", "Deleted.")
        await deleteTrade(t.id)
        await updateClientData()
        client_server_debounce = false
        clone.remove()
    })

    frag.appendChild(clone);
  }

  // Append once, preserves order
  EntriesFrame.appendChild(frag);
}

async function loadTrades() {
  const tradeData = await getTradesOrder(clientData.result['trades']);
  allTrades = tradeData;
  console.log(allTrades)
  
  // Populate filter options
  populateFilterOptions(tradeData);
  
  // Apply filters and render
  const filteredTrades = filterTrades(tradeData);
  renderTrades(filteredTrades);
}


// Handle window resize to recalculate optimal width
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (allTrades.length > 0) {
      const filteredTrades = filterTrades(allTrades);
      renderTrades(filteredTrades);
    }
  }, 250);
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-icon").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
  
  // Add filter event listeners
  if (filterType) filterType.addEventListener("change", () => {
    const filteredTrades = filterTrades(allTrades);
    renderTrades(filteredTrades);
  });
  
  if (filterResult) filterResult.addEventListener("change", () => {
    const filteredTrades = filterTrades(allTrades);
    renderTrades(filteredTrades);
  });
  
  if (filterStatus) filterStatus.addEventListener("change", () => {
    const filteredTrades = filterTrades(allTrades);
    renderTrades(filteredTrades);
  });
  
  if (filterStrategy) filterStrategy.addEventListener("change", () => {
    const filteredTrades = filterTrades(allTrades);
    renderTrades(filteredTrades);
  });
  
  if (filterEmotion) filterEmotion.addEventListener("change", () => {
    const filteredTrades = filterTrades(allTrades);
    renderTrades(filteredTrades);
  });
  
  if (clearFiltersButton) clearFiltersButton.addEventListener("click", () => {
    filterType.value = "all";
    filterResult.value = "all";
    filterStatus.value = "all";
    filterStrategy.value = "all";
    filterEmotion.value = "all";
    renderTrades(allTrades);
  });
});





async function entries_init() {
    await getClientData()
    await sleep(100)
    
    strategyLookup = clientData?.result?.strategies || {};

    loadTrades()
}

entries_init()

