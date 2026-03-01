const fileInput = document.querySelector("#tradeImageInput")
const TRADE_ID_PATTERN = /^[a-f0-9]{16}$/i;

const notify = (message, type = "error") => {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.warn(message);
    }
};

let debounce = false
let tradeLogged = false
let linkedPreTradeSessionId = null
let linkedPreTradeSession = null
let recentPreTrades = []
let ruleComplianceData = null
let strategyLookupById = {}
let selectedStrategyId = null
let editingStrategyId = null
let tradeEntry = {
    id: "",
    emotion: "",
    strategy: [],
    symbol: "",
    notes: "",
    direction: "",
    pl: "",
    img: "",
    saved_img: "",
    type: "",
    EntryExit: "",
    EntryPrice: "",
    RR: "",
    Delta: "",
    Gamma: "",
    Theta: "",
    Vega: "",
    Rho: "",
    IV: ""
};

const getToken = () => window.getAuthTokenSync?.() || null;

const isTradeId = (value) =>
    typeof value === "string" && TRADE_ID_PATTERN.test(value.trim());
const getBrowserTimezone = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const isTradeLoggingDemoAccount = (account) =>
    Boolean(account?.demoData) || !hasPaidAccess(account);

function ensureTradeLoggingDemoUI(account) {
    if (!isTradeLoggingDemoAccount(account)) return;
    document.body.classList.add("demo-mode");

    if (!document.getElementById("demo-mode-local-style")) {
        const style = document.createElement("style");
        style.id = "demo-mode-local-style";
        style.textContent = `
            body.demo-mode .demo-readonly,
            body.demo-mode [data-demo-locked="true"] {
                cursor: not-allowed !important;
            }
        `;
        document.head.appendChild(style);
    }

    if (!document.querySelector(".demo-banner")) {
        const banner = document.createElement("div");
        banner.className = "demo-banner";
        banner.innerHTML = `
            <div>
                <strong>Demo mode</strong>
                <span>Sample data only. Claim founding member access to unlock your own insights.</span>
            </div>
        `;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Claim founding access";
        button.dataset.demoAllow = "true";
        button.addEventListener("click", () => showTradeLimitPaywall());
        banner.appendChild(button);
        document.body.prepend(banner);
    }

    if (!document.querySelector(".demo-fab")) {
        const fab = document.createElement("button");
        fab.type = "button";
        fab.className = "demo-fab";
        fab.textContent = "Claim founding access to unlock your own insights";
        fab.dataset.demoAllow = "true";
        fab.addEventListener("click", () => showTradeLimitPaywall());
        document.body.appendChild(fab);
    }
}

const parseLines = (value) =>
    String(value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

function getEmptyStrategy() {
    return {
        name: "",
        type: "",
        description: "",
        entryRules: { criteria: [] },
        riskRules: {
            maxRiskPerTrade: { amount: "", type: "%" },
            stopLossRequired: "",
            maxTradesPerDay: "",
            maxDailyLoss: { amount: "", type: "%" }
        },
        timeRules: {
            tradingHours: { start: "", end: "" },
            timezone: getBrowserTimezone(),
            daysOfWeek: [],
            newsRestrictions: false,
            newsNotes: ""
        },
        psychologicalRules: {
            avoidEmotions: [],
            avoidConditions: [],
            customConditions: [],
            notes: ""
        },
        customRules: []
    };
}

function normalizeStrategy(rawStrategy) {
    const base = getEmptyStrategy();
    if (!rawStrategy || typeof rawStrategy !== "object") {
        return base;
    }
    base.name = rawStrategy.name || "";
    base.type = rawStrategy.type || "";
    base.description = rawStrategy.description || "";
    base.entryRules.criteria = Array.isArray(rawStrategy.entryRules?.criteria)
        ? [...rawStrategy.entryRules.criteria]
        : [];
    base.riskRules.maxRiskPerTrade.amount =
        rawStrategy.riskRules?.maxRiskPerTrade?.amount ?? "";
    base.riskRules.maxRiskPerTrade.type =
        rawStrategy.riskRules?.maxRiskPerTrade?.type || "%";
    base.riskRules.stopLossRequired = rawStrategy.riskRules?.stopLossRequired || "";
    base.riskRules.maxTradesPerDay = rawStrategy.riskRules?.maxTradesPerDay ?? "";
    base.riskRules.maxDailyLoss.amount =
        rawStrategy.riskRules?.maxDailyLoss?.amount ?? "";
    base.riskRules.maxDailyLoss.type =
        rawStrategy.riskRules?.maxDailyLoss?.type || "%";
    base.timeRules.tradingHours.start =
        rawStrategy.timeRules?.tradingHours?.start || "";
    base.timeRules.tradingHours.end =
        rawStrategy.timeRules?.tradingHours?.end || "";
    base.timeRules.timezone =
        rawStrategy.timeRules?.timezone || getBrowserTimezone();
    base.timeRules.daysOfWeek = Array.isArray(rawStrategy.timeRules?.daysOfWeek)
        ? [...rawStrategy.timeRules.daysOfWeek]
        : [];
    base.timeRules.newsRestrictions = Boolean(rawStrategy.timeRules?.newsRestrictions);
    base.timeRules.newsNotes = rawStrategy.timeRules?.newsNotes || "";
    base.psychologicalRules.avoidEmotions = Array.isArray(
        rawStrategy.psychologicalRules?.avoidEmotions
    )
        ? [...rawStrategy.psychologicalRules.avoidEmotions]
        : [];
    base.psychologicalRules.avoidConditions = Array.isArray(
        rawStrategy.psychologicalRules?.avoidConditions
    )
        ? [...rawStrategy.psychologicalRules.avoidConditions]
        : [];
    base.psychologicalRules.customConditions = Array.isArray(
        rawStrategy.psychologicalRules?.customConditions
    )
        ? [...rawStrategy.psychologicalRules.customConditions]
        : [];
    base.psychologicalRules.notes = rawStrategy.psychologicalRules?.notes || "";
    base.customRules = Array.isArray(rawStrategy.customRules)
        ? [...rawStrategy.customRules]
        : [];
    return base;
}

const startSubscriptionCheckout = async (button) => {
    if (window.startTrialCheckout) {
        await window.startTrialCheckout(button);
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = "/HomeRewrite/login.html";
        return;
    }

    const originalText = button?.textContent || "";
    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Processing...";
        }
        const response = await fetch(
            "https://create-checkout-session-b52ovbio5q-uc.a.run.app",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    offer: "founding_member_beta"
                })
            }
        );
        const checkoutUrl = await response.text();
        const isValidUrl =
            typeof checkoutUrl === "string" && checkoutUrl.startsWith("https://");
        if (response.ok && isValidUrl) {
            sessionStorage.setItem("pendingProCheckout", "true");
            window.location.href = checkoutUrl;
            return;
        }
        notify("Failed to start founding member checkout.", "error");
    } catch (error) {
        console.error("Checkout error:", error);
        notify("Failed to start founding member checkout.", "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
};

const showTradeLimitPaywall = () => {
    const modal = document.getElementById("trade-limit-paywall-modal");
    if (!modal) {
        window.location.href = "/DashboardRewrite/dashboard.html";
        return;
    }

    const closeButton = document.getElementById("trade-limit-paywall-close");
    const claimButton = document.getElementById("trade-limit-claim-founding");

    if (closeButton) {
        closeButton.onclick = () => {
            modal.style.display = "none";
        };
    }

    if (claimButton) {
        claimButton.onclick = () => startSubscriptionCheckout(claimButton);
    }

    modal.style.display = "flex";
    lucide.createIcons();
};

function applyTradeLoggingDemoMode(account) {
    if (!isTradeLoggingDemoAccount(account)) return;
    ensureTradeLoggingDemoUI(account);

    const pageHeader = document.querySelector(".page-header");
    if (pageHeader && !document.getElementById("tradelogging-demo-note")) {
        const note = document.createElement("p");
        note.id = "tradelogging-demo-note";
        note.className = "subtle";
        note.textContent =
            "Demo mode: example trade data is shown. Claim founding member access to unlock real trade logging.";
        pageHeader.appendChild(note);
    }

    const demoTrades = Object.values(account?.trades || {});
    const sample = demoTrades.length
        ? demoTrades[Math.floor(Math.random() * demoTrades.length)]
        : null;

    if (sample) {
        const setValue = (selector, value) => {
            const node = document.querySelector(selector);
            if (!node) return;
            node.value = value === undefined || value === null ? "" : String(value);
        };

        setValue("#entry-SYMBOL", sample.symbol);
        setValue("#entry-PRICE", sample.EntryPrice);
        setValue("#entry-EXIT", sample.EntryExit);
        setValue("#entry-RR", sample.RR);
        setValue("#entry-notes", sample.trade_notes || sample.notes || "");

        if (sample.type) {
            tradeEntry.type = sample.type;
            const typeNode = document.querySelector("#entry-type");
            if (typeNode) typeNode.value = sample.type;
        }
        if (sample.direction) {
            tradeEntry.direction = sample.direction;
            const directionNode = document.querySelector("#entry-direction");
            if (directionNode) directionNode.value = sample.direction;
        }

        if (typeof renderExtractedData === "function") {
            renderExtractedData({
                SYMBOL: sample.symbol || "",
                EntryPrice: sample.EntryPrice ?? "",
                EntryExit: sample.EntryExit ?? "",
                PL: sample.PL ?? "",
                RR: sample.RR ?? "",
            });
        }
    }

    // Keep page visible but block write actions in demo mode.
    const lockSelectors = [
        "#img_Input",
        "#tradeImageInput",
        "#emotion-add",
        "#strategy-add",
    ];
    lockSelectors.forEach((selector) => {
        const node = document.querySelector(selector);
        if (!node) return;
        node.classList.add("demo-readonly");
        node.setAttribute("aria-disabled", "true");
        if ("disabled" in node) node.disabled = true;
    });

    const continueBtn = document.getElementById("continue-button");
    if (continueBtn && continueBtn.parentNode) {
        const lockedButton = continueBtn.cloneNode(true);
        lockedButton.textContent = "Claim founding access to unlock logging";
        lockedButton.classList.add("demo-readonly");
        lockedButton.setAttribute("data-demo-locked", "true");
        lockedButton.style.cursor = "not-allowed";
        continueBtn.parentNode.replaceChild(lockedButton, continueBtn);
        lockedButton.addEventListener("click", (event) => {
            event.preventDefault();
            showTradeLimitPaywall();
        });
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function log_Trade(token) {
    tradeEntry['emotion']
    const response = await fetch("https://log-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            emotion: tradeEntry['emotion'],
            strategy: tradeEntry['strategy'],
            symbol: document.querySelector("#entry-SYMBOL").value,
            trade_notes: document.querySelector("#entry-notes").value,
            EntryPrice: Number(document.querySelector("#entry-PRICE").value),
            EntryExit: Number(document.querySelector("#entry-EXIT").value),
            PL: Number(document.querySelector("#entry-PRICE").value) && Number(document.querySelector("#entry-EXIT").value)
                ? Number(document.querySelector("#entry-EXIT").value) - Number(document.querySelector("#entry-PRICE").value)
                : Number(document.querySelector("#entry-PL")?.value || 0),
            img: tradeEntry['saved_img'],
            type: tradeEntry['type'],
            direction: tradeEntry['direction'],
            RR: document.querySelector("#entry-RR").value,
            Delta: Number(document.querySelector("#entry-Delta").value),
            Gamma: Number(document.querySelector("#entry-Gamma").value),
            Theta: Number(document.querySelector("#entry-Theta").value),
            Vega: Number(document.querySelector("#entry-Vega").value),
            Rho: Number(document.querySelector("#entry-Rho").value),
            IV: Number(document.querySelector("#entry-IV").value),
            preTradeSessionId: linkedPreTradeSessionId || "",
            ruleComplianceStatus: ruleComplianceData?.ruleCompliance?.status || "unknown",
            ruleComplianceNotes: getCheckedComplianceReasons().join("; ") || "",
            ruleComplianceSignals: ruleComplianceData?.ruleCompliance?.signals || null
        })
    });

    const tradeId = await response.text();
    return tradeId;
}

async function analyzeIMG(token, img) {
    const response = await fetch("https://imgreading-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            img: img,
            preTradeSessionId: linkedPreTradeSessionId || null
        })
    });

    data = await response.json()
    console.log(data)
    
    // Handle new response format with rule compliance
    if (data.extracted && data.ruleCompliance) {
        ruleComplianceData = data
        displayRuleCompliance(data.ruleCompliance)
        
        // Extract data from nested structure
        const extracted = data.extracted
        return {
            ...extracted,
            saved_img: data.saved_img
        }
    }
    
    // Fallback for old format
    return data
}

async function add_Emotion(token, emotionvalue) {
     const response = await fetch("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            emotion: emotionvalue,
        })
    });

    const worked = await response.text();
    console.log(worked);
}

async function add_Strategy(token, strategyValue) {
     const response = await fetch("https://add-strategy-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            strategy: strategyValue,
        })
    });

    const worked = await response.text();
    console.log(worked);
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

async function initAnalyzer() {
    val = 0
    while (val < 100) {
        val++
        document.querySelector("#img-analyze").innerHTML = `Analyzing... (${val}%)`
        if (val < 50) {
            await sleep(50)
        } else {
            await sleep(200)
        }
        
    }
}

function renderExtractedData(extracted) {
    const container = document.getElementById("extracted-data-list");
    if (!container) return;

    const fields = [
        { key: "SYMBOL", label: "Symbol" },
        { key: "EntryPrice", label: "Entry Price" },
        { key: "EntryExit", label: "Exit Price" },
        { key: "PL", label: "P/L" },
        { key: "RR", label: "R:R" },
        { key: "IV", label: "IV" },
        { key: "Delta", label: "Delta" },
        { key: "Gamma", label: "Gamma" },
        { key: "Theta", label: "Theta" },
        { key: "Vega", label: "Vega" },
        { key: "Rho", label: "Rho" },
    ];

    container.innerHTML = "";
    if (!extracted) {
        container.innerHTML =
            '<p class="extracted-empty">No data extracted yet.</p>';
        return;
    }

    const rows = fields
        .map((field) => ({
            ...field,
            value: extracted[field.key],
        }))
        .filter((field) => field.value !== "" && field.value !== undefined);

    if (!rows.length) {
        container.innerHTML =
            '<p class="extracted-empty">No data extracted yet.</p>';
        return;
    }

    rows.forEach((field) => {
        const item = document.createElement("div");
        item.className = "extracted-item";

        const label = document.createElement("span");
        label.className = "extracted-label";
        label.textContent = field.label;

        const value = document.createElement("span");
        value.className = "extracted-value";
        value.textContent = field.value;

        item.appendChild(label);
        item.appendChild(value);
        container.appendChild(item);
    });
}

// Function to process an image file (extracted for reuse)
async function processImageFile(file) {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        notify("Invalid image format. Please use PNG, JPG, or JPEG images.", "warning");
        return;
    }

    document.querySelector("#img_Input").style.display = "none"
    document.querySelector("#img-analyze").style.display = "block";
    initAnalyzer()
    
    document.querySelector("#img_Frame").src = URL.createObjectURL(file);
    tradeEntry['img'] = await toBase64(file)
    
    const analyzedData = await analyzeIMG(getToken(), tradeEntry['img'])
    
    // Handle new format with extracted data
    const dataToProcess = analyzedData.extracted || analyzedData;
    renderExtractedData(dataToProcess);
    
    for (let key in dataToProcess) {
        console.log(key)
        tradeEntry[key] = dataToProcess[key]
        if (key == "saved_img") {
            tradeEntry['saved_img'] = analyzedData.saved_img || dataToProcess.saved_img;
            console.log(tradeEntry['saved_img'])
            continue
        }
        const inputElement = document.querySelector(`#entry-${key}`)
        if (inputElement) {
            inputElement.value = dataToProcess[key]
        }
    }
    
    // Handle SYMBOL field (uppercase in response)
    if (dataToProcess.SYMBOL) {
        document.querySelector("#entry-SYMBOL").value = dataToProcess.SYMBOL;
        tradeEntry['symbol'] = dataToProcess.SYMBOL;
    }
    document.querySelector("#img-analyze").style.display = "none";
    document.querySelector("#img_Frame").style.display = "block";
}

// File input change handler
fileInput.addEventListener("change", async function() {
    const file = fileInput.files[0];
    await processImageFile(file);
});

// Paste event handler for images
document.addEventListener('paste', async function(e) {
    // Check if clipboard contains image data
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if the item is an image
        if (item.type.indexOf('image') !== -1) {
            e.preventDefault(); // Prevent default paste behavior
            
            // Validate image type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(item.type)) {
                notify("Invalid image format. Please paste PNG, JPG, or JPEG images only.", "warning");
                return;
            }
            
            // Get the image as a file
            const file = item.getAsFile();
            
            // Create a File object with a proper name
            const fileName = `pasted-image.${item.type.split('/')[1] === 'jpeg' ? 'jpg' : item.type.split('/')[1]}`;
            const imageFile = new File([file], fileName, { type: item.type });
            
            // Process the pasted image
            await processImageFile(imageFile);
            
            // Update the file input to reflect the pasted image
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(imageFile);
            fileInput.files = dataTransfer.files;
            
            break; // Only process the first image
        }
    }
});

async function reloadPage() {
    const mentalDropdown = document.querySelector("#mental-dropdown");
    const stateText = document.querySelector("#state-text");
    if (mentalDropdown) {
        const children = Array.from(mentalDropdown.children);
        for (let child of children) {
            child.remove();
        }
    }

    document.querySelector("#entry-SYMBOL").value = ""
    const entryPriceInput = document.querySelector("#entry-PRICE");
    if (entryPriceInput) entryPriceInput.value = "";
    const entryExitInput = document.querySelector("#entry-EXIT");
    if (entryExitInput) entryExitInput.value = "";
    document.querySelector("#entry-notes").value = ""

    renderExtractedData(null);

    if (mentalDropdown) {
        const emotions = clientData.result['emotions']
        for (let emotion in emotions) {
            const button = document.createElement("button")
            button.innerHTML = emotions[emotion]
            button.classList.add("dropdown-item")
            button.classList.add("inter-text")

            button.addEventListener("click", function() {
                tradeEntry['emotion'] = emotions[emotion]
                if (stateText) {
                    stateText.innerHTML = emotions[emotion]
                }
            })
            mentalDropdown.appendChild(button)
        }
    }

    // Handle viewing existing trade
    let trade = null
    if (localStorage.getItem("tradeView") != null) {
        try {
            trade = clientData.result['trades'][localStorage.getItem("tradeView")]
            if (trade == null) {
                return
            }
            tradeEntry['id'] = localStorage.getItem("tradeView")
            localStorage.removeItem("tradeView")
            tradeEntry['type'] = trade['type']
            tradeEntry['img'] = trade['img']
            tradeEntry['direction'] = trade['direction']
            tradeEntry['strategy'] = trade['strategy']
            tradeEntry['emotion'] = trade['emotion']
            if (trade['img'] != "" && trade['img'] != null) {
                document.querySelector("#img_Frame").src = trade['img']
                document.querySelector("#img_Input").style.display = "none"
                document.querySelector("#img_Frame").style.display = "block";                
            }

            // Update dropdowns for existing trade
            const typeText = document.getElementById("type-text")
            const directionText = document.getElementById("direction-text")
            const strategyText = document.getElementById("strategy-text")
            
            if (typeText && trade['type']) {
                typeText.textContent = trade['type']
                tradeEntry['type'] = trade['type']
            }
            if (directionText && trade['direction']) {
                directionText.textContent = trade['direction']
                tradeEntry['direction'] = trade['direction']
            }
            if (strategyText && trade['strategy'] && trade['strategy'].length > 0) {
                strategyText.textContent = trade['strategy'].join(", ")
                tradeEntry['strategy'] = trade['strategy']
            }
            
            if (stateText) {
                stateText.innerHTML = trade['emotion'] || "State"
            }
            document.querySelector("#entry-SYMBOL").value = trade['symbol']
            const entryPriceInput = document.querySelector("#entry-PRICE");
            if (entryPriceInput) entryPriceInput.value = trade['EntryPrice'] ?? ""
            const entryExitInput = document.querySelector("#entry-EXIT");
            if (entryExitInput) entryExitInput.value = trade['EntryExit'] ?? ""
            if (document.querySelector("#entry-PL")) {
                document.querySelector("#entry-PL").value = trade['PL']
            }
            
            // Update continue button state (enabled for editing existing trades)
            updateContinueButtonState();
            document.querySelector("#entry-RR").value = trade['RR']
            document.querySelector("#entry-Delta").value = trade['Delta']
            document.querySelector("#entry-Gamma").value = trade['Gamma']
            document.querySelector("#entry-Theta").value = trade['Theta']
            document.querySelector("#entry-IV").value = trade['IV']
            document.querySelector("#entry-Rho").value = trade['Rho']
            document.querySelector("#entry-Vega").value = trade['Vega']
            document.querySelector("#entry-notes").value = trade['notes']

            // Show options data if type is Options
            if (trade['type'] == "Options") {
                document.querySelector("#options-data").style.display = "block"
            } else {
                document.querySelector("#options-data").style.display = "none"
            }
            
            // Update continue button state (enabled for editing existing trades)
            updateContinueButtonState();

        } catch (error) {
            console.log("Error occured, trade ID most likely invalid")
        }
    }

    // Populate type, direction, and strategy dropdowns
    populateTypeDropdown()
    populateDirectionDropdown()
    await populateStrategiesDropdown()
    
    // Setup event listeners for type/direction/strategy dropdowns
    setupTradeDropdownListeners()
}

// Populate type dropdown
function populateTypeDropdown() {
    const typeDropdown = document.getElementById("type-dropdown");
    if (!typeDropdown) return;
    
    typeDropdown.innerHTML = "";
    const types = ["Stocks", "Options", "Futures", "Crypto", "Forex"];
    
    types.forEach(type => {
        const button = document.createElement("button");
        button.innerHTML = type;
        button.classList.add("dropdown-item");
        button.classList.add("inter-text");
        
        button.addEventListener("click", function() {
            document.getElementById("type-text").textContent = type;
            tradeEntry['type'] = type;
            typeDropdown.style.display = "none";
            
            // Show/hide options data based on type
            const optionsData = document.getElementById("options-data");
            if (optionsData) {
                if (type === "Options") {
                    optionsData.style.display = "block";
                } else {
                    optionsData.style.display = "none";
                }
            }
        });
        
        typeDropdown.appendChild(button);
    });
}

// Populate direction dropdown
function populateDirectionDropdown() {
    const directionDropdown = document.getElementById("direction-dropdown");
    if (!directionDropdown) return;
    
    directionDropdown.innerHTML = "";
    const directions = ["Long", "Short"];
    
    directions.forEach(direction => {
        const button = document.createElement("button");
        button.innerHTML = direction;
        button.classList.add("dropdown-item");
        button.classList.add("inter-text");
        
        button.addEventListener("click", function() {
            document.getElementById("direction-text").textContent = direction;
            tradeEntry['direction'] = direction;
            directionDropdown.style.display = "none";
        });
        
        directionDropdown.appendChild(button);
    });
}

// Fetch and populate strategies dropdown
async function populateStrategiesDropdown() {
    try {
        const token = getToken();
        if (!token) return;
        
        const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/getPreTradeContext", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            console.error("Failed to fetch strategies");
            return;
        }
        
        const context = await response.json();
        const strategies = context.strategies || {};
        strategyLookupById = {};
        const strategyDropdown = document.getElementById("strategy-dropdown");
        
        if (!strategyDropdown) return;
        
        strategyDropdown.innerHTML = "";
        
        if (Object.keys(strategies).length === 0) {
            const button = document.createElement("button");
            button.innerHTML = "No strategies available";
            button.classList.add("dropdown-item");
            button.classList.add("inter-text");
            button.disabled = true;
            strategyDropdown.appendChild(button);
            return;
        }
        
        for (const [id, rawStrategy] of Object.entries(strategies)) {
            const strategy =
                typeof rawStrategy === "object"
                    ? normalizeStrategy(rawStrategy)
                    : normalizeStrategy({ name: String(rawStrategy || "Unnamed") });
            strategyLookupById[id] = strategy;

            const button = document.createElement("button");
            button.innerHTML = `${strategy.name || "Unnamed"} (${strategy.type || "N/A"})`;
            button.classList.add("dropdown-item");
            button.classList.add("inter-text");
            
            button.addEventListener("click", function() {
                const strategyName = strategy.name || "Unnamed";
                document.getElementById("strategy-text").textContent = strategyName;
                tradeEntry['strategy'] = [strategyName];
                selectedStrategyId = id;
                strategyDropdown.style.display = "none";
            });
            
            strategyDropdown.appendChild(button);
        }
    } catch (error) {
        console.error("Error populating strategies:", error);
    }
}

// Setup event listeners for trade type, direction, and strategy dropdowns
function setupTradeDropdownListeners() {
    const typeButton = document.getElementById("type-dropdown-button");
    const directionButton = document.getElementById("direction-dropdown-button");
    const strategyButton = document.getElementById("strategy-dropdown-button");
    const typeDropdown = document.getElementById("type-dropdown");
    const directionDropdown = document.getElementById("direction-dropdown");
    const strategyDropdown = document.getElementById("strategy-dropdown");
    
    if (typeButton && typeDropdown) {
        typeButton.addEventListener("click", function() {
            if (typeDropdown.style.display == "block") {
                typeDropdown.style.display = "none";
                } else {
                typeDropdown.style.display = "block";
                directionDropdown.style.display = "none";
                strategyDropdown.style.display = "none";
            }
        });
    }
    
    if (directionButton && directionDropdown) {
        directionButton.addEventListener("click", function() {
            if (directionDropdown.style.display == "block") {
                directionDropdown.style.display = "none";
            } else {
                directionDropdown.style.display = "block";
                typeDropdown.style.display = "none";
                strategyDropdown.style.display = "none";
            }
        });
    }
    
    if (strategyButton && strategyDropdown) {
        strategyButton.addEventListener("click", function() {
            if (strategyDropdown.style.display == "block") {
                strategyDropdown.style.display = "none";
            } else {
                strategyDropdown.style.display = "block";
                typeDropdown.style.display = "none";
                directionDropdown.style.display = "none";
            }
        });
    }
}

function openStrategyPickerModal() {
    const modal = document.getElementById("strategy-picker-modal");
    const list = document.getElementById("strategy-picker-list");
    if (!modal || !list) return;

    list.innerHTML = "";
    const entries = Object.entries(strategyLookupById || {});
    if (!entries.length) {
        list.innerHTML =
            '<p class="modal-subtitle">No strategies available yet.</p>';
    } else {
        entries.forEach(([id, strategy]) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "strategy-picker-item";
            item.innerHTML = `
                <p class="strategy-picker-item-title">${strategy.name || "Unnamed Strategy"}</p>
                <p class="strategy-picker-item-meta">${strategy.type || "Strategy"}${strategy.timeRules?.timezone ? ` | ${strategy.timeRules.timezone}` : ""}</p>
            `;
            item.addEventListener("click", () => {
                closeStrategyPickerModal();
                openStrategyEditorModal(id);
            });
            list.appendChild(item);
        });
    }

    modal.style.display = "flex";
}

function closeStrategyPickerModal() {
    const modal = document.getElementById("strategy-picker-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

function fillStrategyEditorForm(strategy) {
    document.getElementById("strategy-editor-name").value = strategy.name || "";
    document.getElementById("strategy-editor-description").value =
        strategy.description || "";
    document.getElementById("strategy-editor-entry").value =
        (strategy.entryRules?.criteria || []).join("\n");
    document.getElementById("strategy-editor-max-risk").value =
        strategy.riskRules?.maxRiskPerTrade?.amount ?? "";
    document.getElementById("strategy-editor-max-risk-type").value =
        strategy.riskRules?.maxRiskPerTrade?.type || "%";
    document.getElementById("strategy-editor-stop-loss").value =
        strategy.riskRules?.stopLossRequired || "";
    document.getElementById("strategy-editor-max-trades").value =
        strategy.riskRules?.maxTradesPerDay ?? "";
    document.getElementById("strategy-editor-max-daily-loss").value =
        strategy.riskRules?.maxDailyLoss?.amount ?? "";
    document.getElementById("strategy-editor-max-daily-loss-type").value =
        strategy.riskRules?.maxDailyLoss?.type || "%";
    document.getElementById("strategy-editor-start-time").value =
        strategy.timeRules?.tradingHours?.start || "";
    document.getElementById("strategy-editor-end-time").value =
        strategy.timeRules?.tradingHours?.end || "";
    document.getElementById("strategy-editor-timezone").value =
        strategy.timeRules?.timezone || getBrowserTimezone();
    const selectedDays = strategy.timeRules?.daysOfWeek || [];
    document
        .querySelectorAll('input[name="strategy-editor-days"]')
        .forEach((checkbox) => {
            checkbox.checked =
                selectedDays.length === 0
                    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(
                          checkbox.value
                      )
                    : selectedDays.includes(checkbox.value);
        });
    document.getElementById("strategy-editor-news-restrictions").checked =
        Boolean(strategy.timeRules?.newsRestrictions);
    document.getElementById("strategy-editor-news-notes").value =
        strategy.timeRules?.newsNotes || "";
    document.getElementById("strategy-editor-avoid-emotions").value = (
        strategy.psychologicalRules?.avoidEmotions || []
    ).join("\n");
    document.getElementById("strategy-editor-avoid-conditions").value = (
        strategy.psychologicalRules?.avoidConditions || []
    ).join("\n");
    document.getElementById("strategy-editor-custom-conditions").value = (
        strategy.psychologicalRules?.customConditions || []
    ).join("\n");
    document.getElementById("strategy-editor-psych-notes").value =
        strategy.psychologicalRules?.notes || "";
    document.getElementById("strategy-editor-custom-rules").value = (
        strategy.customRules || []
    ).join("\n");
}

function buildStrategyFromEditorForm(existing) {
    const strategy = normalizeStrategy(existing);
    strategy.name = document.getElementById("strategy-editor-name").value.trim();
    strategy.description = document
        .getElementById("strategy-editor-description")
        .value.trim();
    strategy.entryRules.criteria = parseLines(
        document.getElementById("strategy-editor-entry").value
    );
    strategy.riskRules.maxRiskPerTrade.amount = document
        .getElementById("strategy-editor-max-risk")
        .value.trim();
    strategy.riskRules.maxRiskPerTrade.type = document.getElementById(
        "strategy-editor-max-risk-type"
    ).value;
    strategy.riskRules.stopLossRequired = document.getElementById(
        "strategy-editor-stop-loss"
    ).value;
    strategy.riskRules.maxTradesPerDay = document
        .getElementById("strategy-editor-max-trades")
        .value.trim();
    strategy.riskRules.maxDailyLoss.amount = document
        .getElementById("strategy-editor-max-daily-loss")
        .value.trim();
    strategy.riskRules.maxDailyLoss.type = document.getElementById(
        "strategy-editor-max-daily-loss-type"
    ).value;
    strategy.timeRules.tradingHours.start = document
        .getElementById("strategy-editor-start-time")
        .value;
    strategy.timeRules.tradingHours.end = document
        .getElementById("strategy-editor-end-time")
        .value;
    strategy.timeRules.timezone = getBrowserTimezone();
    strategy.timeRules.daysOfWeek = Array.from(
        document.querySelectorAll('input[name="strategy-editor-days"]:checked')
    ).map((checkbox) => checkbox.value);
    strategy.timeRules.newsRestrictions = document.getElementById(
        "strategy-editor-news-restrictions"
    ).checked;
    strategy.timeRules.newsNotes = document
        .getElementById("strategy-editor-news-notes")
        .value.trim();
    strategy.psychologicalRules.avoidEmotions = parseLines(
        document.getElementById("strategy-editor-avoid-emotions").value
    );
    strategy.psychologicalRules.avoidConditions = parseLines(
        document.getElementById("strategy-editor-avoid-conditions").value
    );
    strategy.psychologicalRules.customConditions = parseLines(
        document.getElementById("strategy-editor-custom-conditions").value
    );
    strategy.psychologicalRules.notes = document
        .getElementById("strategy-editor-psych-notes")
        .value.trim();
    strategy.customRules = parseLines(
        document.getElementById("strategy-editor-custom-rules").value
    );
    return strategy;
}

function openStrategyEditorModal(strategyId) {
    const strategy = strategyLookupById[strategyId];
    if (!strategy) {
        notify("Strategy not found.", "warning");
        return;
    }
    editingStrategyId = strategyId;
    fillStrategyEditorForm(normalizeStrategy(strategy));
    document.getElementById("strategy-editor-timezone").value = getBrowserTimezone();
    document.getElementById("strategy-editor-modal").style.display = "flex";
}

function closeStrategyEditorModal() {
    editingStrategyId = null;
    document.getElementById("strategy-editor-modal").style.display = "none";
}

async function saveEditedStrategy() {
    if (!editingStrategyId) {
        notify("No strategy selected for editing.", "warning");
        return;
    }

    const existing = strategyLookupById[editingStrategyId];
    const strategy = buildStrategyFromEditorForm(existing);
    if (!strategy.name) {
        notify("Strategy name is required.", "warning");
        return;
    }

    const saveButton = document.getElementById("strategy-editor-save");
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            "https://us-central1-clearentry-5353e.cloudfunctions.net/updateStrategy",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: getToken(),
                    strategyId: editingStrategyId,
                    strategy,
                    timezone: getBrowserTimezone()
                })
            }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.strategyId) {
            throw new Error(result.error || result.message || "Failed to update strategy");
        }

        strategyLookupById[editingStrategyId] = strategy;
        if (selectedStrategyId === editingStrategyId) {
            document.getElementById("strategy-text").textContent =
                strategy.name || "Unnamed Strategy";
            tradeEntry["strategy"] = [strategy.name || "Unnamed Strategy"];
        }

        await populateStrategiesDropdown();
        closeStrategyEditorModal();
        notify("Strategy updated successfully.", "success");
    } catch (error) {
        console.error("Error updating strategy:", error);
        notify(error.message || "Failed to update strategy.", "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

async function loadDropDowns(params) {
    const children = Array.from(document.querySelector("#mental-settings-dropdown").children);
    const children2 = Array.from(document.querySelector("#strategy-settings-dropdown").children);
    const children3 = Array.from(document.querySelector("#strategy-settings-dropdown").children);

    for (let child of children) {
        child.remove();
    }
    for (let child of children2) {
        child.remove();
    }
    for (let child of children3) {
        child.remove();
    }

    // Note: Type and Direction dropdowns removed - now populated from pre-trade sessions



    const emotions = clientData.result['emotions']
    for (let emotion in emotions) {
        const item = document.createElement("p")

        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon2")

        const span2 = document.createElement("span")
        span2.classList.add("inter-text")

        span2.innerHTML = emotions[emotion]

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");

        span.appendChild(icon)
        item.appendChild(span2)
        item.appendChild(span)

        span.addEventListener("click", async function() {
            const emotionToRemove = emotions[emotion];
            
            // Set debounce and show loading frame
            client_server_debounce = true;
            loadingFrame(1000, "Removing Emotion...", "Emotion Removed.");
            
            try {
                // Remove from UI first
            item.remove()
                // Also remove from emotions dropdown
            const emotionButtons = document.querySelectorAll("#mental-dropdown .dropdown-item");
            emotionButtons.forEach(btn => {
                if (btn.innerHTML === emotionToRemove) {
                    btn.remove();
                }
            });
                
                const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: getToken(),
                        emotion: emotionToRemove,
                    })
                });
                
                const result = await response.text();
                client_server_debounce = false;
            } catch (error) {
                client_server_debounce = false;
                console.error("Error removing emotion:", error);
            }
        })
        document.querySelector("#mental-settings-dropdown").appendChild(item)
    }


    const strategies = clientData.result['strategies']
    for (let strategy in strategies) {
        const item = document.createElement("p")

        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon2")

        const span2 = document.createElement("span")
        span2.classList.add("inter-text")

        span2.innerHTML = strategies[strategy]

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");

        span.appendChild(icon)
        item.appendChild(span2)
        item.appendChild(span)

        span.addEventListener("click", async function() {
            const strategyToRemove = strategies[strategy];
            
            // Set debounce and show loading frame
            client_server_debounce = true;
            loadingFrame(1000, "Removing Strategy...", "Strategy Removed.");
            
            try {
                // Remove from UI first
            item.remove()
                // Also remove from confluences dropdown
                const confluencesButtons = document.querySelectorAll("#strategy-dropdown .dropdown-item");
                confluencesButtons.forEach(btn => {
                    if (btn.innerHTML === strategyToRemove) {
                        btn.remove();
                    }
                });
                
                const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: getToken(),
                        strategy: strategyToRemove,
                    })
                });
                
                const result = await response.text();
                client_server_debounce = false;
            } catch (error) {
                client_server_debounce = false;
                console.error("Error removing strategy:", error);
            }
        })
        document.querySelector("#strategy-settings-dropdown").appendChild(item)
    }

    lucide.createIcons();

}



// Strategy dropdown removed - now display-only, populated from pre-trade sessions

// Type and Direction dropdowns removed - now populated from pre-trade sessions




const mentalSettingsButton = document.querySelector("#mental-settings-button");
if (mentalSettingsButton) {
    mentalSettingsButton.addEventListener("click", async function(){
        document.querySelector("#strategy-settings").style.display = "none"
        document.querySelector("#settings-div").style.display = "block"
        document.querySelector("#mental-settings").style.display = "block"
    })
}

const strategySettingsButton = document.querySelector("#strategy-settings-button");
if (strategySettingsButton) {
    strategySettingsButton.addEventListener("click", async function() {
        document.querySelector("#mental-settings").style.display = "none";
        document.querySelector("#settings-div").style.display = "block";
        document.querySelector("#strategy-settings").style.display = "block";
    });
}


for (let i = 0; i < document.querySelectorAll(".close-settingsbutton").length; i++) {
    document.querySelectorAll(".close-settingsbutton")[i].addEventListener("click", function(){
        document.querySelector("#mental-settings").style.display = "none"
        document.querySelector("#settings-div").style.display = "none"
        document.querySelector("#strategy-settings").style.display = "none"
    })
}

document.querySelector("#strategy-add").addEventListener("click", async function() {
    const strategyInput = document.querySelector("#strategy-input");
    const strategyValue = strategyInput.value.trim();
    
    if (strategyValue != "" && strategyValue != null) {
        // Set debounce and show loading frame
        client_server_debounce = true;
        loadingFrame(1000, "Adding Strategy...", "Strategy Added.");
        
        try {
            const response = await fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: getToken(),
                    strategy: strategyValue,
                })
            });

            await updateClientData()

            const result = await response.text();
            client_server_debounce = false;

            // Only add to UI if successful
            if (response.ok && result !== "Invalid") {
                // Add to settings dropdown

        const item = document.createElement("p")

        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
                span.classList.add("dropdown-icon2")
        
                const span2 = document.createElement("span")
                span2.classList.add("inter-text")
        
                span2.innerHTML = strategyValue

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");

        span.appendChild(icon)
                item.appendChild(span2)
        item.appendChild(span)

                span.addEventListener("click", async function() {
                    // Set debounce and show loading frame
                    client_server_debounce = true;
                    loadingFrame(1000, "Removing Strategy...", "Strategy Removed.");
                    
                    try {
                        // Remove from UI first
            item.remove()
                        
                        const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: getToken(),
                    strategy: strategyValue,
                })
                        });
                        
                        const result = await response.text();
                        client_server_debounce = false;
                    } catch (error) {
                        client_server_debounce = false;
                        console.error("Error removing strategy:", error);
                    }
        })
        document.querySelector("#strategy-settings-dropdown").appendChild(item)
                
                // Note: Strategy dropdown removed - strategies are now display-only from pre-trade sessions
                
                lucide.createIcons();
            } else {
                console.error("Failed to add strategy:", result);
            }
        } catch (error) {
            client_server_debounce = false;
            console.error("Error adding strategy:", error);
        }
    }

    strategyInput.value = ""
})

document.querySelector("#emotion-add").addEventListener("click", async function() {
    const emotionInput = document.querySelector("#emotion-input");
    const emotionValue = emotionInput.value.trim();
    
    if (emotionValue != "" && emotionValue != null) {
        // Set debounce and show loading frame
        client_server_debounce = true;
        loadingFrame(1000, "Adding Emotion...", "Emotion Added.");
        
        try {
            const response = await fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: getToken(),
                    emotion: emotionValue,
                })
            });

            const result = await response.text();
            client_server_debounce = false;

            // Only add to UI if successful
            if (response.ok && result !== "Invalid") {
                // Add to settings dropdown
        const item = document.createElement("p")

        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
                span.classList.add("dropdown-icon2")
        
                const span2 = document.createElement("span")
                span2.classList.add("inter-text")
        
                span2.innerHTML = emotionValue

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");

        span.appendChild(icon)
                item.appendChild(span2)
        item.appendChild(span)

                span.addEventListener("click", async function() {
                    // Set debounce and show loading frame
                    client_server_debounce = true;
                    loadingFrame(1000, "Removing Emotion...", "Emotion Removed.");
                    
                    try {
                        // Remove from UI first
            item.remove()
                        // Also remove from emotions dropdown
                        const emotionButtons = document.querySelectorAll("#mental-dropdown .dropdown-item");
                        emotionButtons.forEach(btn => {
                            if (btn.innerHTML === emotionValue) {
                                btn.remove();
                            }
                        });
                        
                        const response = await fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: getToken(),
                    emotion: emotionValue,
                })
                        });
                        
                        const result = await response.text();
                        client_server_debounce = false;
                    } catch (error) {
                        client_server_debounce = false;
                        console.error("Error removing emotion:", error);
                    }
        })
        document.querySelector("#mental-settings-dropdown").appendChild(item)
                
                const mentalDropdown = document.querySelector("#mental-dropdown");
                const stateText = document.querySelector("#state-text");
                if (mentalDropdown) {
                    const emotionButton = document.createElement("button")
                    emotionButton.innerHTML = emotionValue
                    emotionButton.classList.add("dropdown-item")
                    emotionButton.classList.add("inter-text")

                    emotionButton.addEventListener("click", function() {
                        tradeEntry['emotion'] = emotionValue
                        if (stateText) {
                            stateText.innerHTML = emotionValue
                        }
                    })
                    mentalDropdown.appendChild(emotionButton)
                }
                
                lucide.createIcons();
            } else {
                console.error("Failed to add emotion:", result);
            }
        } catch (error) {
            client_server_debounce = false;
            console.error("Error adding emotion:", error);
        }
    }

    emotionInput.value = ""
})

async function saveTrade() {
    tradeEntry['emotion']
    const response = await fetch("https://edit-trade-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: getToken(),
            trade_id: tradeEntry['id'],
            emotion: tradeEntry['emotion'],
            strategy: tradeEntry['strategy'],
            symbol: document.querySelector("#entry-SYMBOL").value,
            notes: document.querySelector("#entry-notes").value,
            EntryPrice: Number(document.querySelector("#entry-PRICE").value),
            EntryExit: Number(document.querySelector("#entry-EXIT").value),
            PL: Number(document.querySelector("#entry-PRICE").value) && Number(document.querySelector("#entry-EXIT").value)
                ? Number(document.querySelector("#entry-EXIT").value) - Number(document.querySelector("#entry-PRICE").value)
                : Number(document.querySelector("#entry-PL")?.value || 0),
            img: tradeEntry['saved_img'],
            type: tradeEntry['type'],
            direction: tradeEntry['direction'],
            RR: document.querySelector("#entry-RR").value,
            Delta: Number(document.querySelector("#entry-Delta").value),
            Gamma: Number(document.querySelector("#entry-Gamma").value),
            Theta: Number(document.querySelector("#entry-Theta").value),
            Vega: Number(document.querySelector("#entry-Vega").value),
            Rho: Number(document.querySelector("#entry-Rho").value),
            IV: Number(document.querySelector("#entry-IV").value)
        })
    })
}

let client_server_debounce = false
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

document.querySelector("#continue-button").addEventListener("click", async function() {
    client_server_debounce = true
    if (tradeEntry['id'] == "") {
        loadingFrame(1000, "Logging Entry...", "Entry Logged.")
        const tradeResponse = await log_Trade(getToken())
        client_server_debounce = false        

        const tradeId = (tradeResponse || "").trim();
        if (tradeId === "Subscription Required" || tradeId === "Trial Required" || tradeId === "Founding Member Required") {
            await sleep(300);
            showTradeLimitPaywall();
            return;
        }

        // Show ranking modal for new trade unless the account just crossed the free trade cap.
        if (isTradeId(tradeId)) {
            const refreshedAccount = window.getAccountData
                ? await window.getAccountData()
                : null;
            const reachedFreeTradeLimit =
                refreshedAccount &&
                !hasPaidAccess(refreshedAccount);
            if (reachedFreeTradeLimit) {
                await sleep(300);
                showTradeLimitPaywall();
                return;
            }
            await sleep(500)
            showRankingModal(tradeId)
        } else {
            await sleep(500)
            window.location.href = window.location.href.split("?")[0];
        }
    } else {
        loadingFrame(1000, "Updating Entry...", "Entry Updated.")
        await saveTrade()
        client_server_debounce = false
        await sleep(500)
        window.location.href = window.location.href.split("?")[0];
    }
})

document.querySelector("#cancel-button").addEventListener("click", function() {
    window.location.href = window.location.href.split("?")[0];
})

// Trade Ranking Modal Functions
let currentTradeIdForRanking = null;
let selectedRank = null;

function showRankingModal(tradeId) {
    currentTradeIdForRanking = tradeId;
    selectedRank = null;
    
    const modal = document.getElementById("trade-ranking-modal");
    const options = document.querySelectorAll(".trade-ranking-option");
    
    // Reset all options
    options.forEach(option => {
        option.classList.remove("selected");
    });
    
    // Show modal
    modal.style.display = "flex";
}

function hideRankingModal() {
    const modal = document.getElementById("trade-ranking-modal");
    modal.style.display = "none";
    selectedRank = null;
}

// Ranking option click handlers
document.querySelectorAll(".trade-ranking-option").forEach(option => {
    option.addEventListener("click", function() {
        // Remove selected class from all options
        document.querySelectorAll(".trade-ranking-option").forEach(opt => {
            opt.classList.remove("selected");
        });
        
        // Add selected class to clicked option
        this.classList.add("selected");
        selectedRank = this.getAttribute("data-rank");
    });
});

// Post-Trade Reflection Modal State
let currentTradeIdForReflection = null;
let reflectionData = {
    strategyRulesFollowed: null,
    primaryEntryReason: null,
    entryReasonOtherText: null,
    wouldRetakeTrade: null,
    emotionAfterTrade: null,
    emotionDescriptionText: "",
    whatWentWellPoorlyText: ""
};

// Show reflection modal
function showReflectionModal(tradeId) {
    currentTradeIdForReflection = tradeId;
    resetReflectionModal();
    
    const modal = document.getElementById("post-trade-reflection-modal");
    modal.style.display = "flex";
}

// Hide reflection modal
function hideReflectionModal() {
    const modal = document.getElementById("post-trade-reflection-modal");
    modal.style.display = "none";
    resetReflectionModal();
}

// Reset reflection modal to initial state
function resetReflectionModal() {
    reflectionData = {
        strategyRulesFollowed: null,
        primaryEntryReason: null,
        entryReasonOtherText: null,
        wouldRetakeTrade: null,
        emotionAfterTrade: null,
        emotionDescriptionText: "",
        whatWentWellPoorlyText: ""
    };
    
    // Reset all option buttons
    document.querySelectorAll(".reflection-option").forEach(option => {
        option.classList.remove("selected");
    });
    
    // Reset dropdowns and text inputs
    document.getElementById("emotion-dropdown").value = "";
    document.getElementById("entry-reason-other").style.display = "none";
    document.getElementById("entry-reason-other").value = "";
    document.getElementById("emotion-description").value = "";
    document.getElementById("what-went-well-poorly").value = "";
}

// Save ranking button handler
document.getElementById("trade-ranking-save").addEventListener("click", async function() {
    if (!selectedRank || !currentTradeIdForRanking) {
        return;
    }
    
    // Disable button and show loading
    this.disabled = true;
    client_server_debounce = true;
    loadingFrame(1000, "Saving Rank...", "Rank Saved.");
    
    try {
        const response = await fetch("https://trade-ranking-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: getToken(),
                tradeId: currentTradeIdForRanking,
                rank: selectedRank
            })
        });

        console.log(currentTradeIdForRanking)
        
        const result = await response.text();
        
        if (response.ok && result !== "Error") {
            client_server_debounce = false;
            await sleep(500);
            hideRankingModal();
            // Show reflection modal after ranking is saved
            await showReflectionModal(currentTradeIdForRanking);
        } else {
            client_server_debounce = false;
            this.disabled = false;
            console.error("Failed to save rank:", result);
            notify("Failed to save rank. Please try again.", "error");
        }
    } catch (error) {
        client_server_debounce = false;
        this.disabled = false;
        console.error("Error saving rank:", error);
        notify("An error occurred. Please try again.", "error");
    }
});

// Reflection Modal Event Handlers

// Handle reflection option clicks
document.querySelectorAll(".reflection-option").forEach(option => {
    option.addEventListener("click", function() {
        const questionType = this.closest(".reflection-question");
        const allOptionsInQuestion = questionType.querySelectorAll(".reflection-option");
        
        // Remove selected from all options in this question
        allOptionsInQuestion.forEach(opt => {
            opt.classList.remove("selected");
        });
        
        // Add selected to clicked option
        this.classList.add("selected");
        const value = this.getAttribute("data-value");
        
        // Store the value based on which question it belongs to
        if (this.closest(".reflection-question").querySelector(".reflection-question-text").textContent.includes("follow your strategy")) {
            reflectionData.strategyRulesFollowed = value;
        } else if (this.closest(".reflection-question").querySelector(".reflection-question-text").textContent.includes("primary reason")) {
            reflectionData.primaryEntryReason = value;
            
            // Show/hide "Other" text input
            if (value === "other-entry") {
                document.getElementById("entry-reason-other").style.display = "block";
            } else {
                document.getElementById("entry-reason-other").style.display = "none";
                reflectionData.entryReasonOtherText = null;
            }
        } else if (this.closest(".reflection-question").querySelector(".reflection-question-text").textContent.includes("take this trade again")) {
            reflectionData.wouldRetakeTrade = value;
        }
    });
});

// Handle "Other" entry reason text input
document.getElementById("entry-reason-other").addEventListener("input", function() {
    reflectionData.entryReasonOtherText = this.value.trim();
});

// Handle emotion dropdown change
document.getElementById("emotion-dropdown").addEventListener("change", function() {
    reflectionData.emotionAfterTrade = this.value;
});

// Handle emotion description textarea
document.getElementById("emotion-description").addEventListener("input", function() {
    reflectionData.emotionDescriptionText = this.value.trim();
});

// Handle "What went well/poorly" textarea
document.getElementById("what-went-well-poorly").addEventListener("input", function() {
    reflectionData.whatWentWellPoorlyText = this.value.trim();
});

// Save reflection button handler
document.getElementById("reflection-save").addEventListener("click", async function() {
    console.log(currentTradeIdForReflection)
    if (!currentTradeIdForReflection) {
        return;
    }
    
    // Validate required fields
    if (!reflectionData.strategyRulesFollowed || !reflectionData.primaryEntryReason || !reflectionData.wouldRetakeTrade || !reflectionData.emotionAfterTrade) {
        notify("Please answer all required questions before submitting.", "warning");
        return;
    }
    
    // If "Other" was selected for entry reason, require the text
    if (reflectionData.primaryEntryReason === "other-entry" && !reflectionData.entryReasonOtherText) {
        notify("Please describe your entry reason.", "warning");
        return;
    }
    
    // Disable button and show loading
    this.disabled = true;
    client_server_debounce = true;
    loadingFrame(1000, "Saving Reflection...", "Reflection Saved.");
    
    try {
        const response = await fetch("https://save-reflection-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: getToken(),
                tradeId: currentTradeIdForReflection,
                reflection: {
                    strategyRulesFollowed: reflectionData.strategyRulesFollowed,
                    primaryEntryReason: reflectionData.primaryEntryReason,
                    entryReasonOtherText: reflectionData.entryReasonOtherText || null,
                    wouldRetakeTrade: reflectionData.wouldRetakeTrade,
                    emotionAfterTrade: reflectionData.emotionAfterTrade,
                    emotionDescriptionText: reflectionData.emotionDescriptionText || "",
                    whatWentWellPoorlyText: reflectionData.whatWentWellPoorlyText || "",
                    completedAt: Date.now() / 1000
                }
            })
        });
        
        const result = await response.text();
        
        if (response.ok && result !== "Error") {
            client_server_debounce = false;
            await sleep(300);
            hideReflectionModal();
            
            // Show AI analysis loading modal
            showAIAnalysisLoading();
            
            // Start AI analysis
            console.log(currentTradeIdForReflection)
            try {
                await analyzeTradeReflection(currentTradeIdForReflection);
            } catch (error) {
                console.error("Error analyzing reflection:", error);
                hideAIAnalysisLoading();
                // Continue to reload even if analysis fails
                await updateClientData();
                await sleep(100);
                window.location.href = window.location.href.split("?")[0];
            }
        } else {
            client_server_debounce = false;
            this.disabled = false;
            console.error("Failed to save reflection:", result);
            notify("Failed to save reflection. Please try again.", "error");
        }
    } catch (error) {
        client_server_debounce = false;
        this.disabled = false;
        console.error("Error saving reflection:", error);
        notify("An error occurred. Please try again.", "error");
    }
});

// Skip reflection button handler
document.getElementById("reflection-skip").addEventListener("click", async function() {
    hideReflectionModal();
    await updateClientData();
    await sleep(100);
    window.location.href = window.location.href.split("?")[0];
});

// AI Analysis Functions
function showAIAnalysisLoading() {
    const modal = document.getElementById("ai-analysis-loading-modal");
    const stepText = document.getElementById("ai-loading-step");
    const progressBar = document.getElementById("ai-loading-progress-bar");
    
    modal.style.display = "flex";
    stepText.textContent = "Reading trade data...";
    progressBar.style.width = "20%";
    
    // Animate progress steps
    setTimeout(() => {
        stepText.textContent = "Analyzing reflection...";
        progressBar.style.width = "40%";
    }, 800);
    
    setTimeout(() => {
        stepText.textContent = "Reviewing pre-trade session...";
        progressBar.style.width = "60%";
    }, 1600);
    
    setTimeout(() => {
        stepText.textContent = "Generating insights...";
        progressBar.style.width = "80%";
    }, 2400);
}

function hideAIAnalysisLoading() {
    const modal = document.getElementById("ai-analysis-loading-modal");
    modal.style.display = "none";
}

const PSYCHOLOGY_ACTION_ENDPOINT =
    "https://add-psychology-action-b52ovbio5q-uc.a.run.app";

function normalizeInsightPayload(payload) {
    if (!payload) {
        return {
            psychologicalInsights: [],
            tradeInsights: [],
            didWell: [],
            needsWork: [],
            actionableAdvice: []
        };
    }

    if (typeof payload === "string") {
        return {
            psychologicalInsights: [],
            tradeInsights: [payload],
            didWell: [],
            needsWork: [],
            actionableAdvice: []
        };
    }

    if (payload.insight && typeof payload.insight === "string") {
        return {
            psychologicalInsights: [],
            tradeInsights: [payload.insight],
            didWell: [],
            needsWork: [],
            actionableAdvice: []
        };
    }

    const normalizeList = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => item?.toString().trim()).filter(Boolean);
        }
        if (typeof value === "string" && value.trim()) {
            return [value.trim()];
        }
        return [];
    };

    return {
        psychologicalInsights: normalizeList(payload.psychologicalInsights),
        tradeInsights: normalizeList(payload.tradeInsights),
        didWell: normalizeList(payload.didWell),
        needsWork: normalizeList(payload.needsWork),
        actionableAdvice: normalizeList(payload.actionableAdvice)
    };
}

function renderInsightList(listId, emptyId, items) {
    const list = document.getElementById(listId);
    const empty = document.getElementById(emptyId);
    if (!list || !empty) return;

    list.innerHTML = "";
    if (!items || !items.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";
    items.forEach((item) => {
        const row = document.createElement("li");
        row.textContent = item;
        list.appendChild(row);
    });
}

async function addPsychologyAction(actionText, button) {
    if (!actionText) return;
    if (button) {
        button.disabled = true;
        button.textContent = "Adding...";
    }

    try {
        const response = await fetch(PSYCHOLOGY_ACTION_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: getToken(),
                action: actionText,
                source: "post-trade-reflection",
                tradeId: currentTradeIdForReflection || null
            })
        });

        const result = await response.json().catch(() => ({}));
        if (response.ok && result?.added !== false) {
            if (button) {
                button.textContent = "Added";
            }
            return;
        }

        if (button) {
            button.disabled = false;
            button.textContent = "Add to psychology plan";
        }
        notify("Unable to add to psychology plan.", "error");
    } catch (error) {
        if (button) {
            button.disabled = false;
            button.textContent = "Add to psychology plan";
        }
        notify("Unable to add to psychology plan.", "error");
    }
}

function renderActionableAdvice(items) {
    const list = document.getElementById("ai-action-list");
    const empty = document.getElementById("ai-action-empty");
    if (!list || !empty) return;

    list.innerHTML = "";
    if (!items || !items.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";
    items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "ai-action-item";

        const text = document.createElement("span");
        text.className = "ai-action-text";
        text.textContent = item;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-ghost btn-sm ai-action-button";
        button.textContent = "Add to psychology plan";
        button.addEventListener("click", () =>
            addPsychologyAction(item, button)
        );

        row.appendChild(text);
        row.appendChild(button);
        list.appendChild(row);
    });
}

function showAIInsights(payload) {
    const modal = document.getElementById("ai-insights-modal");
    modal.style.display = "flex";
    lucide.createIcons();

    const data = normalizeInsightPayload(payload);
    renderInsightList("ai-psych-insights", "ai-psych-empty", data.psychologicalInsights);
    renderInsightList("ai-trade-insights", "ai-trade-empty", data.tradeInsights);
    renderInsightList("ai-good-insights", "ai-good-empty", data.didWell);
    renderInsightList("ai-bad-insights", "ai-bad-empty", data.needsWork);
    renderActionableAdvice(data.actionableAdvice);
}

function hideAIInsights() {
    const modal = document.getElementById("ai-insights-modal");
    modal.style.display = "none";
}

async function analyzeTradeReflection(tradeId) {
    const stepText = document.getElementById("ai-loading-step");
    const progressBar = document.getElementById("ai-loading-progress-bar");
    console.log(tradeId)
    try {
        stepText.textContent = "Connecting to AI...";
        progressBar.style.width = "90%";
        
        const response = await fetch("https://analyze-post-trade-reflection-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: getToken(),
                tradeId: tradeId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            progressBar.style.width = "100%";
            stepText.textContent = "Complete!";
            await sleep(500);
            
            hideAIAnalysisLoading();
            showAIInsights(result);
        } else {
            throw new Error(result.error || "Analysis failed");
        }
    } catch (error) {
        console.error("Error in AI analysis:", error);
        throw error;
    }
}

// AI Insights close button handler
document.getElementById("ai-insights-close").addEventListener("click", async function() {
    // Don't hide the modal, just reload the page
    await updateClientData();
    await sleep(100);
    window.location.href = window.location.href.split("?")[0];
});

// Fetch recent pre-trades from clientData
function fetchRecentPreTrades() {
    try {
        if (!clientData || !clientData.result) return;
        
        const preTradeSessions = clientData.result.preTradeSessions || {};
        const strategies = clientData.result.strategies || {};
        const trades = clientData.result.trades || {};
        
        // Get list of preTradeSessionIds already linked to trades
        const linkedSessionIds = new Set();
        for (let tradeId in trades) {
            const preTradeId = trades[tradeId]?.preTradeSessionId;
            if (preTradeId) {
                linkedSessionIds.add(preTradeId);
            }
        }
        
        // Get recent sessions (last 12 hours, not linked)
        const currentTime = Date.now() / 1000; // Convert to seconds
        const twelveHoursAgo = currentTime - (12 * 3600);
        
        recentPreTrades = [];
        for (let sessionId in preTradeSessions) {
            const session = preTradeSessions[sessionId];
            const createdAt = session.createdAt || 0;
            
            // Only include sessions from last 12 hours and not already linked
            if (createdAt >= twelveHoursAgo && !linkedSessionIds.has(sessionId)) {
                // Get strategy name
                const strategyId = session.strategyId || '';
                let strategyName = 'Unknown Strategy';
                if (strategyId && strategies[strategyId]) {
                    strategyName = strategies[strategyId].name || 'Unnamed Strategy';
                }
                
                // Format time
                const timeStr = new Date(createdAt * 1000).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
                
                recentPreTrades.push({
                    id: sessionId,
                    createdAt: createdAt,
                    time: timeStr,
                    symbol: session.symbol || '',
                    direction: session.direction || '',
                    type: session.type || '',
                    strategyId: strategyId,
                    strategyName: strategyName,
                    proceededWithViolations: session.proceededWithViolations || false,
                    emotionalState: session.emotionalState || ''
                });
            }
        }
        
        // Sort by createdAt (newest first)
        recentPreTrades.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        populatePreTradeDropdown();
    } catch (error) {
        console.error("Error fetching recent pre-trades:", error);
    }
}

// Populate pre-trade dropdown
function populatePreTradeDropdown() {
    const dropdown = document.getElementById("pretrade-dropdown");
    dropdown.innerHTML = "";
    
    if (recentPreTrades.length === 0) {
        const item = document.createElement("button");
        item.className = "dropdown-item inter-text";
        item.innerHTML = "No recent pre-trades available";
        item.disabled = true;
        dropdown.appendChild(item);
        return;
    }
    
    recentPreTrades.forEach(session => {
        const item = document.createElement("button");
        item.className = "dropdown-item inter-text";
        const warningBadge = session.proceededWithViolations 
            ? '<span style="margin-left: 8px; padding: 2px 6px; background-color: rgba(255, 167, 38, 0.2); color: #ffa726; border-radius: 4px; font-size: 10px; font-weight: 600;">Warnings</span>' 
            : '';
        item.innerHTML = `${session.time} - ${session.symbol} ${session.type || ""} ${session.direction || ""} (${session.strategyName})${warningBadge}`;
        item.addEventListener("click", () => {
            linkPreTradeSession(session.id);
            document.getElementById("pretrade-dropdown").style.display = "none";
        });
        dropdown.appendChild(item);
    });
}

// Link a pre-trade session
function linkPreTradeSession(sessionId) {
    try {
        let session = recentPreTrades.find(s => s.id === sessionId);
        console.log(session)
        if (!session && clientData && clientData.result) {
            // Try to get from clientData if not in recent list
            const preTradeSessions = clientData.result.preTradeSessions || {};
            const strategies = clientData.result.strategies || {};
            const rawSession = preTradeSessions[sessionId];
            
            if (rawSession) {
                // Format session like recentPreTrades items
                const strategyId = rawSession.strategyId || '';
                let strategyName = 'Unknown Strategy';
                if (strategyId && strategies[strategyId]) {
                    strategyName = strategies[strategyId].name || 'Unnamed Strategy';
                }
                
                const timeStr = new Date((rawSession.createdAt || 0) * 1000).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
                
                session = {
                    id: sessionId,
                    createdAt: rawSession.createdAt || 0,
                    time: timeStr,
                    symbol: rawSession.symbol || '',
                    direction: rawSession.direction || '',
                    type: rawSession.type || '',
                    strategyId: strategyId,
                    strategyName: strategyName,
                    proceededWithViolations: rawSession.proceededWithViolations || false,
                    emotionalState: rawSession.emotionalState || ''
                };
            }
        }
        
        if (session) {
            linkedPreTradeSession = session;
            linkedPreTradeSessionId = sessionId;
            autoFillFromPreTrade();
            updatePreTradeUI();
            updateContinueButtonState(); // Enable continue button
        } else {
            console.error("Pre-trade session not found:", sessionId);
        }
    } catch (error) {
        console.error("Error linking pre-trade session:", error);
    }
}

// Auto-fill fields from PreTradeSession
function autoFillFromPreTrade() {
    if (!linkedPreTradeSession) return;
    
    const symbolInput = document.querySelector("#entry-SYMBOL");
    const typeText = document.getElementById("type-text");
    const directionText = document.getElementById("direction-text");
    const strategyText = document.getElementById("strategy-text");
    const optionsDataSection = document.getElementById("options-data");
    
    // Auto-fill symbol (read-only when linked)
    if (linkedPreTradeSession.symbol) {
        symbolInput.value = linkedPreTradeSession.symbol;
        symbolInput.readOnly = true;
        symbolInput.style.backgroundColor = "#16181d";
        symbolInput.style.cursor = "not-allowed";
    }
    
    // Auto-fill type
    if (linkedPreTradeSession.type) {
        tradeEntry['type'] = linkedPreTradeSession.type;
        if (typeText) {
            typeText.textContent = linkedPreTradeSession.type;
        }
        
        // Show options data if type is Options
        if (optionsDataSection) {
            if (linkedPreTradeSession.type === "Options") {
                optionsDataSection.style.display = "block";
            } else {
                optionsDataSection.style.display = "none";
            }
        }
    }
    
    // Auto-fill direction
    if (linkedPreTradeSession.direction) {
        tradeEntry['direction'] = linkedPreTradeSession.direction;
        if (directionText) {
            directionText.textContent = linkedPreTradeSession.direction;
        }
    }
    
    // Auto-fill strategy
    if (linkedPreTradeSession.strategyId) {
        tradeEntry['strategy'] = [linkedPreTradeSession.strategyName || "Unnamed Strategy"];
        selectedStrategyId = linkedPreTradeSession.strategyId;
        if (strategyText && linkedPreTradeSession.strategyName) {
            strategyText.textContent = linkedPreTradeSession.strategyName;
        }
    }
    
    // Note: Mental state is NOT auto-filled - user selects post-trade mental state
}

// Reset fields when unlinked
function resetFieldsAfterUnlink() {
    const symbolInput = document.querySelector("#entry-SYMBOL");
    const typeText = document.getElementById("type-text");
    const directionText = document.getElementById("direction-text");
    const strategyText = document.getElementById("strategy-text");
    const optionsDataSection = document.getElementById("options-data");
    
    if (symbolInput) {
        symbolInput.readOnly = false;
        symbolInput.style.backgroundColor = "";
        symbolInput.style.cursor = "";
        symbolInput.value = "";
    }
    
    if (typeText) typeText.textContent = "Select Type";
    if (directionText) directionText.textContent = "Select Direction";
    if (strategyText) strategyText.textContent = "Select Strategy";
    
    if (optionsDataSection) optionsDataSection.style.display = "none";
    
    // Reset tradeEntry
    tradeEntry['type'] = "";
    tradeEntry['direction'] = "";
    tradeEntry['strategy'] = [];
    selectedStrategyId = null;
}

// Update Continue button state based on pre-trade session
function updateContinueButtonState() {
    const continueButton = document.getElementById("continue-button");
    if (!continueButton) return;
    
    // Always enabled (pre-trade linking is optional)
    continueButton.disabled = false;
    continueButton.style.opacity = "1";
    continueButton.style.cursor = "pointer";
}

// Update Pre-Trade UI
function updatePreTradeUI() {
    const unlinkButton = document.getElementById("unlink-pretrade-btn");
    
    if (linkedPreTradeSessionId && linkedPreTradeSession) {
        // Show unlink button
        if (unlinkButton) unlinkButton.style.display = "block";
        
        // Update dropdown button text
        const timeStr = linkedPreTradeSession.time || new Date(linkedPreTradeSession.createdAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const pretradeText = document.getElementById("pretrade-text");
        if (pretradeText) {
            pretradeText.innerHTML = `${timeStr} - ${linkedPreTradeSession.symbol || ""} ${linkedPreTradeSession.direction || ""}`;
        }
    } else {
        // Hide unlink button when not linked
        if (unlinkButton) unlinkButton.style.display = "none";
        
        const pretradeText = document.getElementById("pretrade-text");
        if (pretradeText) {
            pretradeText.textContent = "Select a Pre-Trade";
        }
    }
    
    // Update continue button state
    updateContinueButtonState();
}

// Unlink pre-trade
function unlinkPreTrade() {
    linkedPreTradeSessionId = null;
    linkedPreTradeSession = null;
    resetFieldsAfterUnlink();
    updatePreTradeUI();
    updateContinueButtonState(); // Disable continue button if no pre-trade
    
    // Clear rule compliance display
    const complianceSection = document.getElementById("rule-compliance-section");
    if (complianceSection) complianceSection.style.display = "none";
    ruleComplianceData = null;
}

// Get checked compliance reasons
function getCheckedComplianceReasons() {
    const checkboxes = document.querySelectorAll(".compliance-checkbox:checked");
    const checkedReasons = [];
    checkboxes.forEach(checkbox => {
        checkedReasons.push(checkbox.getAttribute("data-reason"));
    });
    return checkedReasons;
}

// Display rule compliance with checkboxes
function displayRuleCompliance(compliance) {
    const section = document.getElementById("rule-compliance-section");
    const badge = document.getElementById("compliance-badge");
    const reasons = document.getElementById("compliance-reasons");
    
    if (!compliance || compliance.status === "unknown") {
        if (section) section.style.display = "none";
        return;
    }
    
    if (section) section.style.display = "block";
    
    // Set badge color and text
    if (compliance.status === "rule-following") {
        badge.style.backgroundColor = "rgba(0, 255, 153, 0.2)";
        badge.style.color = "#00ff99";
        badge.textContent = "âœ“ Rule-Following";
    } else if (compliance.status === "rule-breaking") {
        badge.style.backgroundColor = "rgba(255, 23, 68, 0.2)";
        badge.style.color = "#ff1744";
        badge.textContent = "âš  Rule-Breaking";
    } else {
        badge.style.backgroundColor = "rgba(128, 128, 128, 0.2)";
        badge.style.color = "#86909a";
        badge.textContent = "? Unknown";
    }
    
    // Display reasons as checkboxes (checked by default)
    if (compliance.reasons && compliance.reasons.length > 0) {
        reasons.innerHTML = "<p class='inter-text' style='color: #86909a; font-size: 13px; margin-top: 15px; margin-bottom: 10px; font-weight: 500;'>AI Identified Issues (uncheck if incorrect):</p>";
        
        compliance.reasons.forEach((reason, index) => {
            const checkboxId = `compliance-reason-${index}`;
            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "compliance-checkbox-item";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = checkboxId;
            checkbox.checked = true; // Start checked by default
            checkbox.className = "compliance-checkbox";
            checkbox.setAttribute("data-reason", reason);
            
            const label = document.createElement("label");
            label.htmlFor = checkboxId;
            label.className = "inter-text";
            label.textContent = reason;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            reasons.appendChild(checkboxContainer);
        });
    } else {
        reasons.innerHTML = "";
    }
}

// Handle URL parameters on page load
function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const preTradeSessionId = urlParams.get('preTradeSessionId');
    
    if (preTradeSessionId) {
        // Auto-link the pre-trade session from URL
        linkPreTradeSession(preTradeSessionId);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    if (window.getAuthToken) {
        await window.getAuthToken();
    }
    await getClientData()
    await sleep(100)

    console.log(clientData.result)
    const currentAccount = clientData?.result || {};
    if (isTradeLoggingDemoAccount(currentAccount)) {
        applyTradeLoggingDemoMode(currentAccount);
    }
    
    reloadPage()
    loadDropDowns()

    updatePreTradeUI();
    
    // Fetch recent pre-trades from clientData, then handle URL params
    fetchRecentPreTrades();
    handleURLParams();
    
    // Pre-trade dropdown button
    const pretradeDropdownButton = document.getElementById("pretrade-dropdown-button");
    if (pretradeDropdownButton) {
        pretradeDropdownButton.addEventListener("click", function() {
            const dropdown = document.getElementById("pretrade-dropdown");
            if (dropdown.style.display == "block") {
                dropdown.style.display = "none";
            } else {
                dropdown.style.display = "block";
            }
        });
    }
    
    // Unlink pre-trade button
    const unlinkButton = document.getElementById("unlink-pretrade-btn");
    if (unlinkButton) {
        unlinkButton.addEventListener("click", unlinkPreTrade);
    }

    const strategyEditButton = document.getElementById("strategy-edit-button");
    if (strategyEditButton) {
        strategyEditButton.addEventListener("click", async () => {
            if (!Object.keys(strategyLookupById).length) {
                await populateStrategiesDropdown();
            }
            openStrategyPickerModal();
        });
    }

    const strategyPickerClose = document.getElementById("strategy-picker-close");
    if (strategyPickerClose) {
        strategyPickerClose.addEventListener("click", closeStrategyPickerModal);
    }

    const strategyEditorCancel = document.getElementById("strategy-editor-cancel");
    if (strategyEditorCancel) {
        strategyEditorCancel.addEventListener("click", closeStrategyEditorModal);
    }

    const strategyEditorSave = document.getElementById("strategy-editor-save");
    if (strategyEditorSave) {
        strategyEditorSave.addEventListener("click", saveEditedStrategy);
    }

    const strategyPickerModal = document.getElementById("strategy-picker-modal");
    if (strategyPickerModal) {
        strategyPickerModal.addEventListener("click", (event) => {
            if (event.target === strategyPickerModal) {
                closeStrategyPickerModal();
            }
        });
    }

    const strategyEditorModal = document.getElementById("strategy-editor-modal");
    if (strategyEditorModal) {
        strategyEditorModal.addEventListener("click", (event) => {
            if (event.target === strategyEditorModal) {
                closeStrategyEditorModal();
            }
        });
    }
    
    document.querySelector("#head-frame").addEventListener('click', function(event) {
        if (event.target.closest('#bar-icon')) {
            console.log("Check")
            document.querySelector("#sidebar").style.display = "block";
        } else {
            // Click originated outside the overlay
        }
    });
});



async function logINIT() {
    
}



logINIT();
