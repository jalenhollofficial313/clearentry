// Pre-Trade State
let preTradeState = {
    context: null,
    selectedStrategy: null,
    checklist: [],
    violations: [],
    emotionalState: "",
    tradeType: "",
    acknowledgement: {
        checked: false,
        reason: "",
        notes: ""
    }
};

let selectedDirection = null;
const getToken = async () =>
    window.getAuthToken ? await window.getAuthToken() : null;
const notify = (message, type = "error") => {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.warn(message);
    }
};

// Initialize page
async function pretradeINIT() {
    // Show loader
    document.getElementById("pretrade-full-loader").style.display = "flex";
    
    try {
        // Get client data
        await getClientData();
        const token = await getToken();
        if (!token) {
            window.location.href = "../Home/index.html";
            return;
        }

        // Fetch pre-trade context
        const context = await getPreTradeContext(token);
        preTradeState.context = context;
        
        // Populate strategies
        populateStrategies(context.strategies);
        
        // Update time display
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 1000);
        
        // Update session label
        updateSessionLabel();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error("Error initializing pre-trade:", error);
        showError("Failed to load pre-trade context. Please refresh the page.");
    } finally {
        // Hide loader
        document.getElementById("pretrade-full-loader").style.display = "none";
    }
    
    lucide.createIcons();
}

// Fetch pre-trade context from backend
async function getPreTradeContext(token) {
    const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/getPreTradeContext", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch pre-trade context");
    }
    
    return await response.json();
}

// Populate strategy dropdown
function populateStrategies(strategies) {
    const select = document.getElementById("strategy-select");
    select.innerHTML = '<option value="">-- Select Strategy --</option>';
    
    if (!strategies || Object.keys(strategies).length === 0) {
        select.innerHTML += '<option value="" disabled>No strategies available. Create one in your dashboard.</option>';
        return;
    }
    
    for (const [id, strategy] of Object.entries(strategies)) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${strategy.name || "Unnamed"} (${strategy.type || "N/A"})`;
        option.dataset.strategy = JSON.stringify(strategy);
        select.appendChild(option);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Setup sidebar toggle
    const barIcon = document.querySelector("#bar-icon");
    const sidebar = document.querySelector("#sidebar");
    
    if (barIcon && sidebar) {
        document.querySelector("#head-frame").addEventListener('click', function(event) {
            if (event.target.closest('#bar-icon')) {
                console.log("Check")
                document.querySelector("#sidebar").style.display = "block";
            } else {
                // Click originated outside the overlay
            }
        });
    }
    
    // Trade type selection
    document.getElementById("trade-type-select").addEventListener("change", (e) => {
        preTradeState.tradeType = e.target.value;
        validateForm();
    });
    
    // Strategy selection
    document.getElementById("strategy-select").addEventListener("change", onStrategySelect);
    
    // Direction toggle
    document.querySelectorAll(".direction-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".direction-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedDirection = btn.dataset.direction;
            if (preTradeState.selectedStrategy) {
                generateChecklist();
            }
        });
    });
    
    // Emotional state
    document.getElementById("emotional-state-select").addEventListener("change", onEmotionalStateChange);
    
    // Acknowledgement checkbox
    document.getElementById("acknowledgement-checkbox").addEventListener("change", onAcknowledgementChange);
    
    // Enter Trade button
    document.getElementById("enter-trade-btn").addEventListener("click", onEnterTrade);
    
    // Symbol input
    document.getElementById("symbol-input").addEventListener("input", validateForm);
}

// Handle strategy selection
async function onStrategySelect(e) {
    const select = e.target;
    const selectedOption = select.options[select.selectedIndex];
    
    if (!selectedOption.value) {
        preTradeState.selectedStrategy = null;
        document.getElementById("rules-card").style.display = "none";
        document.getElementById("checklist-card").style.display = "none";
        validateForm();
        return;
    }
    
    try {
        const strategy = JSON.parse(selectedOption.dataset.strategy);
        preTradeState.selectedStrategy = { id: select.value, ...strategy };
        
        // Display rules
        displayRules(strategy);
        
        // Generate checklist when strategy is selected
        await generateChecklist();
        
    } catch (error) {
        console.error("Error loading strategy:", error);
        showError("Failed to load strategy. Please try again.");
    }
    
    validateForm();
}

    // Display strategy rules
function displayRules(strategy) {
    const rulesContent = document.getElementById("rules-content");
    rulesContent.innerHTML = "";
    
    // Entry Rules
    if (strategy.entryRules && Object.keys(strategy.entryRules).length > 0) {
        const entrySection = createRuleSection("Entry Rules", strategy.entryRules);
        rulesContent.appendChild(entrySection);
    }
    
    // Risk Rules
    if (strategy.riskRules && Object.keys(strategy.riskRules).length > 0) {
        const riskSection = createRuleSection("Risk Management", strategy.riskRules);
        rulesContent.appendChild(riskSection);
    }
    
    // Time Rules
    if (strategy.timeRules && Object.keys(strategy.timeRules).length > 0) {
        const timeSection = createRuleSection("Trading Time", strategy.timeRules);
        rulesContent.appendChild(timeSection);
    }
    
    // Psychological Rules
    if (strategy.psychologicalRules && Object.keys(strategy.psychologicalRules).length > 0) {
        const psychSection = createRuleSection("Psychological", strategy.psychologicalRules);
        rulesContent.appendChild(psychSection);
    }
    
    document.getElementById("rules-card").style.display = "block";
}

// Create rule section
function createRuleSection(title, rules) {
    const section = document.createElement("div");
    section.className = "rule-section";
    
    const titleEl = document.createElement("h3");
    titleEl.className = "rule-section-title inter-text";
    titleEl.textContent = title;
    
    const content = document.createElement("div");
    content.className = "rule-section-content";
    
    // Format rules based on structure
    for (const [key, value] of Object.entries(rules)) {
        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
            continue;
        }
        
        const item = document.createElement("div");
        item.className = "rule-item";
        
        const label = document.createElement("span");
        label.className = "rule-item-label inter-text";
        label.textContent = formatKey(key) + ":";
        
        const val = document.createElement("span");
        val.className = "rule-item-value inter-text";
        val.textContent = formatValue(value);
        
        item.appendChild(label);
        item.appendChild(val);
        content.appendChild(item);
    }
    
    section.appendChild(titleEl);
    section.appendChild(content);
    
    return section;
}

// Format key for display
function formatKey(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim();
}

// Format value for display
function formatValue(value) {
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
        if (value.amount && value.type) {
            return `${value.amount}${value.type}`;
        }
        return JSON.stringify(value);
    }
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    return String(value);
}

// Generate checklist from strategy rules
async function generateChecklist() {
    if (!preTradeState.selectedStrategy) {
        return;
    }
    
    const token = await getToken();
    const symbol = document.getElementById("symbol-input").value;
    
    // Show checklist card and loading indicator
    const checklistCard = document.getElementById("checklist-card");
    const checklistLoading = document.getElementById("checklist-loading");
    const checklistItems = document.getElementById("checklist-items");
    
    checklistCard.style.display = "block";
    checklistLoading.style.display = "flex";
    checklistItems.style.display = "none";
    
    try {
        const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/generatePreTradeChecklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token,
                strategyId: preTradeState.selectedStrategy.id,
                symbol: symbol || "",
                direction: selectedDirection
            })
        });
        
        if (!response.ok) {
            throw new Error("Failed to generate checklist");
        }
        
        const data = await response.json();
        preTradeState.checklist = data.checklistItems || [];
        preTradeState.violations = data.violations || [];
        
        // Hide loading and show checklist
        checklistLoading.style.display = "none";
        checklistItems.style.display = "block";
        
        displayChecklist();
        displayViolations();
        updateAcknowledgementCard();
        validateForm();
        
    } catch (error) {
        console.error("Error generating checklist:", error);
        checklistLoading.style.display = "none";
        checklistItems.style.display = "block";
        showError("Failed to generate checklist. Please try again.");
    }
}

// Display checklist
function displayChecklist() {
    const checklistContainer = document.getElementById("checklist-items");
    checklistContainer.innerHTML = "";
    
    if (preTradeState.checklist.length === 0) {
        checklistContainer.innerHTML = '<p class="inter-text" style="color: #86909a;">No checklist items available.</p>';
        return;
    }
    
    preTradeState.checklist.forEach((item, index) => {
        const checklistItem = document.createElement("div");
        checklistItem.className = "checklist-item";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checklist-${index}`;
        checkbox.checked = item.checked || false;
        checkbox.addEventListener("change", () => {
            item.checked = checkbox.checked;
            validateForm();
        });
        
        const content = document.createElement("div");
        content.className = "checklist-item-content";
        
        const label = document.createElement("label");
        label.className = "checklist-item-label inter-text";
        label.htmlFor = `checklist-${index}`;
        label.textContent = item.label;
        
        if (item.helper) {
            const helper = document.createElement("p");
            helper.className = "checklist-item-helper inter-text";
            helper.textContent = item.helper;
            content.appendChild(helper);
        }
        
        content.insertBefore(label, content.firstChild);
        
        const status = document.createElement("span");
        status.className = `checklist-item-status status-${item.status || "pass"}`;
        status.textContent = item.status || "pass";
        
        checklistItem.appendChild(checkbox);
        checklistItem.appendChild(content);
        checklistItem.appendChild(status);
        checklistContainer.appendChild(checklistItem);
    });
    
    document.getElementById("checklist-card").style.display = "block";
}

// Display violations
function displayViolations() {
    const warningsCard = document.getElementById("warnings-card");
    const warningsList = document.getElementById("warnings-list");
    
    if (preTradeState.violations.length === 0) {
        warningsCard.style.display = "none";
        return;
    }
    
    warningsList.innerHTML = "";
    preTradeState.violations.forEach(violation => {
        const warningItem = document.createElement("div");
        warningItem.className = "warning-item inter-text";
        warningItem.textContent = violation.message;
        warningsList.appendChild(warningItem);
    });
    
    warningsCard.style.display = "block";
}

// Update acknowledgement card visibility
function updateAcknowledgementCard() {
    const ackCard = document.getElementById("acknowledgement-card");
    if (preTradeState.violations.length > 0) {
        ackCard.style.display = "block";
    } else {
        ackCard.style.display = "none";
        preTradeState.acknowledgement.checked = false;
        document.getElementById("acknowledgement-checkbox").checked = false;
    }
}

// Handle emotional state change
function onEmotionalStateChange(e) {
    preTradeState.emotionalState = e.target.value;
    
    // Check if emotional state violates rules
    if (preTradeState.selectedStrategy && preTradeState.selectedStrategy.psychologicalRules) {
        const avoidEmotions = preTradeState.selectedStrategy.psychologicalRules.avoidEmotions || [];
        if (avoidEmotions.includes(preTradeState.emotionalState)) {
            // Add violation if not already present
            const existingViolation = preTradeState.violations.find(v => v.key === "emotional_state");
            if (!existingViolation) {
                preTradeState.violations.push({
                    key: "emotional_state",
                    message: `Warning: Your emotional state "${preTradeState.emotionalState}" is in your avoid list.`,
                    severity: "warning"
                });
                displayViolations();
                updateAcknowledgementCard();
            }
        }
    }
    
    validateForm();
}

// Handle acknowledgement change
function onAcknowledgementChange(e) {
    preTradeState.acknowledgement.checked = e.target.checked;
    const fields = document.querySelector(".acknowledgement-fields");
    if (e.target.checked) {
        fields.style.display = "flex";
    } else {
        fields.style.display = "none";
    }
    validateForm();
}

// Validate form and enable/disable Enter Trade button
function validateForm() {
    const symbol = document.getElementById("symbol-input").value.trim();
    const strategy = preTradeState.selectedStrategy;
    const tradeType = preTradeState.tradeType;
    const btn = document.getElementById("enter-trade-btn");
    const status = document.getElementById("cta-status");
    
    let isValid = true;
    let statusText = "";
    
    if (!tradeType) {
        isValid = false;
        statusText = "Trade type is required";
    } else if (!symbol) {
        isValid = false;
        statusText = "Symbol is required";
    } else if (!strategy) {
        isValid = false;
        statusText = "Please select a strategy";
    } else if (preTradeState.violations.length > 0 && !preTradeState.acknowledgement.checked) {
        isValid = false;
        statusText = "Please acknowledge rule violations";
    } else if (preTradeState.checklist.length > 0) {
        // Check if at least one required item is checked
        const requiredItems = preTradeState.checklist.filter(item => 
            item.status === "fail" || (item.status === "warning" && !item.checked)
        );
        if (requiredItems.length > 0 && !preTradeState.acknowledgement.checked) {
            isValid = false;
            statusText = "Please review checklist items";
        }
    }
    
    btn.disabled = !isValid;
    status.textContent = statusText;
    
    if (preTradeState.violations.length > 0 && preTradeState.acknowledgement.checked) {
        btn.classList.add("warning-state");
        status.textContent = "Proceeding with warnings";
    } else {
        btn.classList.remove("warning-state");
    }
}

// Handle Enter Trade
async function onEnterTrade() {
    const btn = document.getElementById("enter-trade-btn");
    btn.disabled = true;
    btn.textContent = "Processing...";
    
    try {
        const token = await getToken();
        const symbol = document.getElementById("symbol-input").value.trim();
        
        // Create pre-trade session
        const sessionResponse = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/createPreTradeSession", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token,
                symbol,
                type: preTradeState.tradeType,
                direction: selectedDirection,
                strategyId: preTradeState.selectedStrategy.id,
                checklistItems: preTradeState.checklist,
                emotionalState: preTradeState.emotionalState,
                violations: preTradeState.violations,
                acknowledgement: preTradeState.acknowledgement.checked ? {
                    acknowledged: true,
                    reason: document.getElementById("acknowledgement-reason").value,
                    notes: document.getElementById("acknowledgement-notes").value
                } : null
            })
        });
        
        if (!sessionResponse.ok) {
            throw new Error("Failed to create pre-trade session");
        }
        
        const sessionData = await sessionResponse.json();
        const preTradeSessionId = sessionData.sessionId;
        
        // Update clientData to include the new pre-trade session
        await updateClientData();
        await getClientData(); // Refresh local clientData variable
        
        // Redirect to trade logging with pre-trade session ID
        window.location.href = `../TradeLoggingRewrite/tradelogging.html?preTradeSessionId=${preTradeSessionId}`;
        
    } catch (error) {
        console.error("Error entering trade:", error);
        showError("Failed to enter trade. Please try again.");
        btn.disabled = false;
        btn.textContent = "Enter Trade";
        validateForm();
    }
}

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    document.getElementById("time-display").textContent = `${hours}:${minutes}`;
}

// Update session label
function updateSessionLabel() {
    const now = new Date();
    const hour = now.getHours();
    let session = "Pre-market";
    
    if (hour >= 4 && hour < 9) {
        session = "Pre-market";
    } else if (hour >= 9 && hour < 12) {
        session = "Open";
    } else if (hour >= 12 && hour < 15) {
        session = "Midday";
    } else if (hour >= 15 && hour < 16) {
        session = "Power Hour";
    } else {
        session = "After Hours";
    }
    
    document.getElementById("session-label").textContent = session;
}

// Show error message
function showError(message) {
    const errorCard = document.getElementById("error-message");
    const errorText = document.querySelector(".error-text");
    errorText.textContent = message;
    errorCard.style.display = "block";
    
    setTimeout(() => {
        errorCard.style.display = "none";
    }, 5000);
}

// Strategy Creation Modal State
let strategyModalState = {
    currentStep: 1,
    totalSteps: 7,
    strategy: {
        name: "",
        description: "",
        entryRules: {
            criteria: []
        },
        riskRules: {
            maxRiskPerTrade: { amount: "", type: "%" },
            stopLossRequired: "",
            maxTradesPerDay: "",
            maxDailyLoss: { amount: "", type: "%" }
        },
        timeRules: {
            tradingHours: { start: "", end: "" },
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
    }
};

// Strategy Modal Functions
function openStrategyModal() {
    document.getElementById("strategy-modal").style.display = "flex";
    strategyModalState.currentStep = 1;
    showStrategyStep(1);
    lucide.createIcons();
}

function closeStrategyModal() {
    document.getElementById("strategy-modal").style.display = "none";
    resetStrategyModal();
}

function resetStrategyModal() {
    strategyModalState.currentStep = 1;
    strategyModalState.strategy = {
        name: "",
        description: "",
        entryRules: { criteria: [] },
        riskRules: { maxRiskPerTrade: { amount: "", type: "%" }, stopLossRequired: "", maxTradesPerDay: "", maxDailyLoss: { amount: "", type: "%" } },
        timeRules: { tradingHours: { start: "", end: "" }, daysOfWeek: [], newsRestrictions: false, newsNotes: "" },
        psychologicalRules: { avoidEmotions: [], avoidConditions: [], customConditions: [], notes: "" },
        customRules: []
    };
    
    // Reset all form fields
    document.getElementById("modal-strategy-name").value = "";
    document.getElementById("modal-strategy-description").value = "";
    document.getElementById("modal-max-risk-amount").value = "";
    document.getElementById("modal-stop-loss-required").value = "";
    document.getElementById("modal-max-trades-day").value = "";
    document.getElementById("modal-max-daily-loss-amount").value = "";
    document.getElementById("modal-trading-start").value = "";
    document.getElementById("modal-trading-end").value = "";
    Array.from(document.querySelectorAll('input[name="modal-trading-days"]')).forEach(cb => cb.checked = true);
    document.getElementById("modal-news-restrictions").checked = false;
    document.getElementById("modal-news-notes").value = "";
    Array.from(document.querySelectorAll('input[name="modal-avoid-emotions"]')).forEach(cb => cb.checked = false);
    Array.from(document.querySelectorAll('input[name="modal-avoid-conditions"]')).forEach(cb => cb.checked = false);
    document.getElementById("modal-psych-notes").value = "";
    document.getElementById("modal-confirmation-checkbox").checked = false;
    
    // Reset dynamic lists
    strategyModalState.strategy.entryRules.criteria = [];
    strategyModalState.strategy.psychologicalRules.customConditions = [];
    strategyModalState.strategy.customRules = [];
    renderModalEntryCriteriaList();
    renderModalCustomConditionsList();
    renderModalCustomRulesList();
}

function showStrategyStep(step) {
    // Hide all steps
    for (let i = 1; i <= strategyModalState.totalSteps; i++) {
        const stepEl = document.getElementById(`strategy-step-${i}`);
        if (stepEl) {
            stepEl.style.display = "none";
        }
    }
    
    // Show current step
    const currentStepEl = document.getElementById(`strategy-step-${step}`);
    if (currentStepEl) {
        currentStepEl.style.display = "flex";
    }
    
    // Initialize dynamic lists when showing relevant steps
    if (step === 2) {
        renderModalEntryCriteriaList();
    } else if (step === 5) {
        renderModalCustomConditionsList();
    } else if (step === 6) {
        renderModalCustomRulesList();
    }
    
    // Update button visibility
    const backBtn = document.getElementById("strategy-modal-back");
    const nextBtn = document.getElementById("strategy-modal-next");
    const saveBtn = document.getElementById("strategy-modal-save");
    
    if (backBtn) backBtn.style.display = step > 1 ? "block" : "none";
    if (nextBtn) nextBtn.style.display = step < strategyModalState.totalSteps ? "block" : "none";
    if (saveBtn) saveBtn.style.display = step === strategyModalState.totalSteps ? "block" : "none";
    
    // Special handling for summary step
    if (step === strategyModalState.totalSteps) {
        saveStrategyStepData(step - 1);
        buildStrategySummary();
        document.getElementById("modal-confirmation-checkbox").checked = false;
        const saveBtn = document.getElementById("strategy-modal-save");
        if (saveBtn) saveBtn.disabled = true;
        document.getElementById("modal-confirmation-checkbox").addEventListener("change", function() {
            const saveBtn = document.getElementById("strategy-modal-save");
            if (saveBtn) saveBtn.disabled = !this.checked;
        });
    }
    
    strategyModalState.currentStep = step;
}

function validateStrategyStep(step) {
    switch(step) {
        case 1:
            const name = document.getElementById("modal-strategy-name").value.trim();
            if (!name) {
                notify("Please fill in strategy name.", "warning");
                return false;
            }
            break;
        case 3:
            const maxRisk = document.getElementById("modal-max-risk-amount").value;
            const stopLoss = document.getElementById("modal-stop-loss-required").value;
            const maxTrades = document.getElementById("modal-max-trades-day").value;
            const maxDailyLoss = document.getElementById("modal-max-daily-loss-amount").value;
            if (!maxRisk || !stopLoss || !maxTrades || !maxDailyLoss) {
                notify("Please fill in all required risk management fields.", "warning");
                return false;
            }
            break;
        case 7:
            const confirmation = document.getElementById("modal-confirmation-checkbox").checked;
            if (!confirmation) {
                notify(
                    "Please confirm that you understand the rules will be used to validate trades.",
                    "warning"
                );
                return false;
            }
            break;
    }
    return true;
}

function saveStrategyStepData(step) {
    switch(step) {
        case 1:
            strategyModalState.strategy.name = document.getElementById("modal-strategy-name").value.trim();
            strategyModalState.strategy.description = document.getElementById("modal-strategy-description").value.trim();
            break;
        case 2:
            // Entry criteria are managed dynamically, already saved in strategyModalState.strategy.entryRules.criteria
            break;
        case 3:
            strategyModalState.strategy.riskRules.maxRiskPerTrade = {
                amount: document.getElementById("modal-max-risk-amount").value,
                type: document.getElementById("modal-max-risk-type").value
            };
            strategyModalState.strategy.riskRules.stopLossRequired = document.getElementById("modal-stop-loss-required").value;
            strategyModalState.strategy.riskRules.maxTradesPerDay = document.getElementById("modal-max-trades-day").value;
            strategyModalState.strategy.riskRules.maxDailyLoss = {
                amount: document.getElementById("modal-max-daily-loss-amount").value,
                type: document.getElementById("modal-max-daily-loss-type").value
            };
            break;
        case 4:
            strategyModalState.strategy.timeRules.tradingHours = {
                start: document.getElementById("modal-trading-start").value,
                end: document.getElementById("modal-trading-end").value
            };
            strategyModalState.strategy.timeRules.daysOfWeek = Array.from(document.querySelectorAll('input[name="modal-trading-days"]:checked')).map(cb => cb.value);
            strategyModalState.strategy.timeRules.newsRestrictions = document.getElementById("modal-news-restrictions").checked;
            strategyModalState.strategy.timeRules.newsNotes = document.getElementById("modal-news-notes").value.trim();
            break;
        case 5:
            strategyModalState.strategy.psychologicalRules.avoidEmotions = Array.from(document.querySelectorAll('input[name="modal-avoid-emotions"]:checked')).map(cb => cb.value);
            strategyModalState.strategy.psychologicalRules.avoidConditions = Array.from(document.querySelectorAll('input[name="modal-avoid-conditions"]:checked')).map(cb => cb.value);
            // Custom conditions are managed dynamically, already saved in strategyModalState.strategy.psychologicalRules.customConditions
            strategyModalState.strategy.psychologicalRules.notes = document.getElementById("modal-psych-notes").value.trim();
            break;
        case 6:
            // Custom rules are managed dynamically, already saved in strategyModalState.strategy.customRules
            break;
    }
}

function buildStrategySummary() {
    const summaryContent = document.getElementById("strategy-summary-content");
    const s = strategyModalState.strategy;
    
    summaryContent.innerHTML = `
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Strategy</h4>
            <p class="strategy-summary-item inter-text"><strong>Name:</strong> ${s.name}</p>
            ${s.description ? `<p class="strategy-summary-item inter-text"><strong>Description:</strong> ${s.description}</p>` : ''}
        </div>
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Entry Rules</h4>
            ${s.entryRules.criteria.length > 0 ? `<p class="strategy-summary-item inter-text"><strong>Entry Criteria:</strong><ul style="margin: 5px 0; padding-left: 20px;">${s.entryRules.criteria.map(c => `<li>${c}</li>`).join('')}</ul></p>` : '<p class="strategy-summary-item inter-text">No entry criteria defined</p>'}
        </div>
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Risk Management</h4>
            <p class="strategy-summary-item inter-text"><strong>Max Risk Per Trade:</strong> ${s.riskRules.maxRiskPerTrade.amount}${s.riskRules.maxRiskPerTrade.type}</p>
            <p class="strategy-summary-item inter-text"><strong>Stop-Loss Required:</strong> ${s.riskRules.stopLossRequired === "yes" ? "Yes" : "No"}</p>
            <p class="strategy-summary-item inter-text"><strong>Max Trades Per Day:</strong> ${s.riskRules.maxTradesPerDay}</p>
            <p class="strategy-summary-item inter-text"><strong>Max Daily Loss:</strong> ${s.riskRules.maxDailyLoss.amount}${s.riskRules.maxDailyLoss.type}</p>
        </div>
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Trading Time Rules</h4>
            ${s.timeRules.tradingHours.start || s.timeRules.tradingHours.end ? `<p class="strategy-summary-item inter-text"><strong>Trading Hours:</strong> ${s.timeRules.tradingHours.start || "Not set"} - ${s.timeRules.tradingHours.end || "Not set"}</p>` : '<p class="strategy-summary-item inter-text">Not set (optional)</p>'}
            ${s.timeRules.daysOfWeek.length > 0 ? `<p class="strategy-summary-item inter-text"><strong>Days:</strong> ${s.timeRules.daysOfWeek.join(", ")}</p>` : ''}
            ${s.timeRules.newsRestrictions ? `<p class="strategy-summary-item inter-text"><strong>News Restrictions:</strong> Yes</p>` : ''}
            ${s.timeRules.newsNotes ? `<p class="strategy-summary-item inter-text"><strong>News Notes:</strong> ${s.timeRules.newsNotes}</p>` : ''}
        </div>
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Psychological Rules</h4>
            ${s.psychologicalRules.avoidEmotions.length > 0 ? `<p class="strategy-summary-item inter-text"><strong>Avoid Emotions:</strong> ${s.psychologicalRules.avoidEmotions.join(", ")}</p>` : ''}
            ${s.psychologicalRules.avoidConditions.length > 0 ? `<p class="strategy-summary-item inter-text"><strong>Avoid Conditions:</strong> ${s.psychologicalRules.avoidConditions.join(", ")}</p>` : ''}
            ${s.psychologicalRules.customConditions.length > 0 ? `<p class="strategy-summary-item inter-text"><strong>Custom Conditions:</strong><ul style="margin: 5px 0; padding-left: 20px;">${s.psychologicalRules.customConditions.map(c => `<li>${c}</li>`).join('')}</ul></p>` : ''}
            ${s.psychologicalRules.notes ? `<p class="strategy-summary-item inter-text"><strong>Notes:</strong> ${s.psychologicalRules.notes}</p>` : ''}
        </div>
        ${s.customRules.length > 0 ? `
        <div class="strategy-summary-section">
            <h4 class="strategy-summary-title inter-text">Custom Rules</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
                ${s.customRules.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

async function saveStrategyToBackend() {
    // Save current step data
    saveStrategyStepData(7);
    
    const token = await getToken();
    if (!token) {
        notify("Session expired. Please log in again.", "error");
        return;
    }
    
    try {
        const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/saveStrategy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token,
                strategy: strategyModalState.strategy
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.strategyId) {
            // Update clientData
            await updateClientData();
            await getClientData();
            
            // Close modal
            closeStrategyModal();
            
            // Reload page to refresh all data
            location.reload();
        } else {
            notify(`Error saving strategy: ${result}`, "error");
        }
    } catch (error) {
        console.error("Error saving strategy:", error);
        notify("Network error. Please try again.", "error");
    }
}

// Strategy Modal Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const addStrategyBtn = document.getElementById("add-strategy-btn");
    if (addStrategyBtn) {
        addStrategyBtn.addEventListener("click", openStrategyModal);
    }
    
    const closeModalBtn = document.getElementById("close-strategy-modal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeStrategyModal);
    }
    
    const cancelBtn = document.getElementById("strategy-modal-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeStrategyModal);
    }
    
    const backBtn = document.getElementById("strategy-modal-back");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (strategyModalState.currentStep > 1) {
                saveStrategyStepData(strategyModalState.currentStep);
                showStrategyStep(strategyModalState.currentStep - 1);
            }
        });
    }
    
    const nextBtn = document.getElementById("strategy-modal-next");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (validateStrategyStep(strategyModalState.currentStep)) {
                saveStrategyStepData(strategyModalState.currentStep);
                showStrategyStep(strategyModalState.currentStep + 1);
            }
        });
    }
    
    const saveBtn = document.getElementById("strategy-modal-save");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (validateStrategyStep(7)) {
                saveStrategyToBackend();
            }
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById("strategy-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeStrategyModal();
            }
        });
    }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    pretradeINIT();
});

// Re-generate checklist when symbol changes
document.getElementById("symbol-input").addEventListener("blur", () => {
    if (preTradeState.selectedStrategy) {
        generateChecklist();
    }
});

// Modal Entry Criteria Management
function renderModalEntryCriteriaList() {
    const listEl = document.getElementById("modal-entry-criteria-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    strategyModalState.strategy.entryRules.criteria.forEach((criterion, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${criterion}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeModalEntryCriterion(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addModalEntryCriterion() {
    const input = document.getElementById("modal-new-entry-criterion");
    const value = input.value.trim();
    if (!value) return;
    
    strategyModalState.strategy.entryRules.criteria.push(value);
    input.value = "";
    renderModalEntryCriteriaList();
}

function removeModalEntryCriterion(index) {
    strategyModalState.strategy.entryRules.criteria.splice(index, 1);
    renderModalEntryCriteriaList();
}

// Modal Custom Conditions Management
function renderModalCustomConditionsList() {
    const listEl = document.getElementById("modal-custom-conditions-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    strategyModalState.strategy.psychologicalRules.customConditions.forEach((condition, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${condition}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeModalCustomCondition(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addModalCustomCondition() {
    const input = document.getElementById("modal-new-custom-condition");
    const value = input.value.trim();
    if (!value) return;
    
    strategyModalState.strategy.psychologicalRules.customConditions.push(value);
    input.value = "";
    renderModalCustomConditionsList();
}

function removeModalCustomCondition(index) {
    strategyModalState.strategy.psychologicalRules.customConditions.splice(index, 1);
    renderModalCustomConditionsList();
}

// Modal Custom Rules Management
function renderModalCustomRulesList() {
    const listEl = document.getElementById("modal-custom-rules-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    strategyModalState.strategy.customRules.forEach((rule, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${rule}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeModalCustomRule(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addModalCustomRule() {
    const input = document.getElementById("modal-new-custom-rule");
    const value = input.value.trim();
    if (!value) return;
    
    strategyModalState.strategy.customRules.push(value);
    input.value = "";
    renderModalCustomRulesList();
}

function removeModalCustomRule(index) {
    strategyModalState.strategy.customRules.splice(index, 1);
    renderModalCustomRulesList();
}

