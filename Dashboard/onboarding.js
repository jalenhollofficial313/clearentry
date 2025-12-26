// Onboarding Wizard State Management
let onboardingState = {
    currentStep: 1,
    totalSteps: 11,
    tradingProfile: {
        markets: [],
        primarySession: "",
        experienceLevel: ""
    },
    strategies: []
};

let currentStrategy = {
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
};

// Initialize onboarding wizard
function initOnboarding() {
    onboardingState.currentStep = 1;
    showStep(1);
    updateProgress();
    document.getElementById("onboarding-wizard").style.display = "flex";
    // Trap focus within wizard
    document.getElementById("onboarding-wizard").focus();
}

function showStep(step) {
    // Hide all steps
    for (let i = 1; i <= onboardingState.totalSteps; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (stepEl) {
            stepEl.style.display = "none";
        }
    }
    
    // Show current step
    const currentStepEl = document.getElementById(`step-${step}`);
    if (currentStepEl) {
        currentStepEl.style.display = "block";
    }
    
    // Special handling for step 10 - update text based on whether strategies exist
    if (step === 10) {
        const titleEl = document.getElementById("step-10-title");
        const descEl = document.getElementById("step-10-description");
        const btnEl = document.getElementById("step-10-add-btn");
        
        if (onboardingState.strategies.length === 0) {
            if (titleEl) titleEl.textContent = "Create a Strategy?";
            if (descEl) descEl.textContent = "Would you like to create a strategy now, or add one later from your dashboard?";
            if (btnEl) btnEl.textContent = "Create strategy";
        } else {
            if (titleEl) titleEl.textContent = "Add Another Strategy?";
            if (descEl) descEl.textContent = "Do you trade more than one setup?";
            if (btnEl) btnEl.textContent = "Add another strategy";
        }
    }
    
    // Initialize dynamic lists when showing relevant steps
    if (step === 4) {
        renderEntryCriteriaList();
    } else if (step === 7) {
        renderCustomConditionsList();
    } else if (step === 8) {
        renderCustomRulesList();
    }
    
    onboardingState.currentStep = step;
    updateProgress();
    lucide.createIcons();
}

function updateProgress() {
    const progress = (onboardingState.currentStep / onboardingState.totalSteps) * 100;
    document.getElementById("progress-fill").style.width = `${progress}%`;
    document.getElementById("current-step").textContent = onboardingState.currentStep;
    document.getElementById("total-steps").textContent = onboardingState.totalSteps;
}

function onboardingNext() {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return;
    }
    
    // Special handling for step 3 -> step 4 (only if strategy is being created)
    if (onboardingState.currentStep === 3) {
        const strategyName = document.getElementById("strategy-name").value.trim();
        
        // If strategy name is filled, proceed to rules
        if (strategyName) {
            saveCurrentStepData();
            showStep(4);
            return;
        } else {
            // If no strategy name filled, skip to "add another" step
            if (onboardingState.strategies.length === 0) {
                // No strategies yet, go to step 10 to ask if they want to create one
                showStep(10);
                return;
            } else {
                // They have strategies, go to step 10 to ask if they want to add another
                showStep(10);
                return;
            }
        }
    }
    
    // Save current step data
    saveCurrentStepData();
    
    // Special handling for step 8 -> step 9 (summary)
    if (onboardingState.currentStep === 8) {
        showSummaryStep();
        showStep(9);
        return;
    }
    
    if (onboardingState.currentStep < onboardingState.totalSteps) {
        showStep(onboardingState.currentStep + 1);
    }
}

function onboardingBack() {
    if (onboardingState.currentStep > 1) {
        showStep(onboardingState.currentStep - 1);
    }
}

function validateCurrentStep() {
    const step = onboardingState.currentStep;
    
    switch(step) {
        case 2: // Trading Profile
            const markets = Array.from(document.querySelectorAll('input[name="markets"]:checked')).map(cb => cb.value);
            if (markets.length === 0) {
                alert("Please select at least one market.");
                return false;
            }
            const primarySession = document.getElementById("primary-session").value;
            if (!primarySession) {
                alert("Please select a primary session.");
                return false;
            }
            break;
            
        case 3: // Create Strategy - Now optional, validation only if they're trying to proceed
            // No validation needed - they can skip
            break;
            
        case 5: // Risk Management
            const maxRisk = document.getElementById("max-risk-amount").value;
            if (!maxRisk) {
                alert("Please enter max risk per trade.");
                return false;
            }
            const stopLoss = document.getElementById("stop-loss-required").value;
            if (!stopLoss) {
                alert("Please specify if stop-loss is required.");
                return false;
            }
            const maxTrades = document.getElementById("max-trades-day").value;
            if (!maxTrades) {
                alert("Please enter max trades per day.");
                return false;
            }
            const maxDailyLoss = document.getElementById("max-daily-loss-amount").value;
            if (!maxDailyLoss) {
                alert("Please enter max daily loss.");
                return false;
            }
            break;
            
        case 9: // Strategy Summary
            const confirmation = document.getElementById("confirmation-checkbox").checked;
            if (!confirmation) {
                alert("Please confirm that you understand the rules will be used to validate trades.");
                return false;
            }
            break;
    }
    
    return true;
}

function saveCurrentStepData() {
    const step = onboardingState.currentStep;
    
    switch(step) {
        case 2: // Trading Profile
            onboardingState.tradingProfile.markets = Array.from(document.querySelectorAll('input[name="markets"]:checked')).map(cb => cb.value);
            onboardingState.tradingProfile.primarySession = document.getElementById("primary-session").value;
            onboardingState.tradingProfile.experienceLevel = document.getElementById("experience-level").value;
            break;
            
        case 3: // Create Strategy
            currentStrategy.name = document.getElementById("strategy-name").value.trim();
            currentStrategy.description = document.getElementById("strategy-description").value.trim();
            break;
            
        case 4: // Entry Rules
            // Entry criteria are managed dynamically, already saved in currentStrategy.entryRules.criteria
            break;
            
        case 5: // Risk Management
            currentStrategy.riskRules.maxRiskPerTrade = {
                amount: document.getElementById("max-risk-amount").value,
                type: document.getElementById("max-risk-type").value
            };
            currentStrategy.riskRules.stopLossRequired = document.getElementById("stop-loss-required").value;
            currentStrategy.riskRules.maxTradesPerDay = document.getElementById("max-trades-day").value;
            currentStrategy.riskRules.maxDailyLoss = {
                amount: document.getElementById("max-daily-loss-amount").value,
                type: document.getElementById("max-daily-loss-type").value
            };
            break;
            
        case 6: // Trading Time Rules
            currentStrategy.timeRules.tradingHours = {
                start: document.getElementById("trading-start").value,
                end: document.getElementById("trading-end").value
            };
            currentStrategy.timeRules.daysOfWeek = Array.from(document.querySelectorAll('input[name="trading-days"]:checked')).map(cb => cb.value);
            currentStrategy.timeRules.newsRestrictions = document.getElementById("news-restrictions").checked;
            currentStrategy.timeRules.newsNotes = document.getElementById("news-notes").value.trim();
            break;
            
        case 7: // Psychological Rules
            currentStrategy.psychologicalRules.avoidEmotions = Array.from(document.querySelectorAll('input[name="avoid-emotions"]:checked')).map(cb => cb.value);
            currentStrategy.psychologicalRules.avoidConditions = Array.from(document.querySelectorAll('input[name="avoid-conditions"]:checked')).map(cb => cb.value);
            // Custom conditions are managed dynamically, already saved in currentStrategy.psychologicalRules.customConditions
            currentStrategy.psychologicalRules.notes = document.getElementById("psych-notes").value.trim();
            break;
            
        case 8: // Custom Rules
            // Custom rules are managed dynamically, already saved in currentStrategy.customRules
            break;
    }
}

function buildStrategySummary() {
    const summaryDiv = document.getElementById("strategy-summary");
    summaryDiv.innerHTML = `
        <div class="summary-section">
            <h3 class="summary-title inter-text">Strategy</h3>
            <p class="summary-item"><strong>Name:</strong> ${currentStrategy.name}</p>
            ${currentStrategy.description ? `<p class="summary-item"><strong>Description:</strong> ${currentStrategy.description}</p>` : ''}
        </div>
        
        <div class="summary-section">
            <h3 class="summary-title inter-text">Entry Rules</h3>
            ${currentStrategy.entryRules.criteria.length > 0 ? `<p class="summary-item"><strong>Entry Criteria:</strong><ul style="margin: 5px 0; padding-left: 20px;">${currentStrategy.entryRules.criteria.map(c => `<li>${c}</li>`).join('')}</ul></p>` : '<p class="summary-item">No entry criteria defined</p>'}
        </div>
        
        <div class="summary-section">
            <h3 class="summary-title inter-text">Risk Management</h3>
            <p class="summary-item"><strong>Max Risk Per Trade:</strong> ${currentStrategy.riskRules.maxRiskPerTrade.amount}${currentStrategy.riskRules.maxRiskPerTrade.type}</p>
            <p class="summary-item"><strong>Stop-Loss Required:</strong> ${currentStrategy.riskRules.stopLossRequired === "yes" ? "Yes" : "No"}</p>
            <p class="summary-item"><strong>Max Trades Per Day:</strong> ${currentStrategy.riskRules.maxTradesPerDay}</p>
            <p class="summary-item"><strong>Max Daily Loss:</strong> ${currentStrategy.riskRules.maxDailyLoss.amount}${currentStrategy.riskRules.maxDailyLoss.type}</p>
        </div>
        
        <div class="summary-section">
            <h3 class="summary-title inter-text">Trading Time Rules</h3>
            ${currentStrategy.timeRules.tradingHours.start || currentStrategy.timeRules.tradingHours.end ? `<p class="summary-item"><strong>Trading Hours:</strong> ${currentStrategy.timeRules.tradingHours.start || "Not set"} - ${currentStrategy.timeRules.tradingHours.end || "Not set"}</p>` : '<p class="summary-item">Not set (optional)</p>'}
            ${currentStrategy.timeRules.daysOfWeek.length > 0 ? `<p class="summary-item"><strong>Days:</strong> ${currentStrategy.timeRules.daysOfWeek.join(", ")}</p>` : ''}
            ${currentStrategy.timeRules.newsRestrictions ? `<p class="summary-item"><strong>News Restrictions:</strong> Yes</p>` : ''}
            ${currentStrategy.timeRules.newsNotes ? `<p class="summary-item"><strong>News Notes:</strong> ${currentStrategy.timeRules.newsNotes}</p>` : ''}
        </div>
        
        <div class="summary-section">
            <h3 class="summary-title inter-text">Psychological Rules</h3>
            ${currentStrategy.psychologicalRules.avoidEmotions.length > 0 ? `<p class="summary-item"><strong>Avoid Emotions:</strong> ${currentStrategy.psychologicalRules.avoidEmotions.join(", ")}</p>` : ''}
            ${currentStrategy.psychologicalRules.avoidConditions.length > 0 ? `<p class="summary-item"><strong>Avoid Conditions:</strong> ${currentStrategy.psychologicalRules.avoidConditions.join(", ")}</p>` : ''}
            ${currentStrategy.psychologicalRules.customConditions.length > 0 ? `<p class="summary-item"><strong>Custom Conditions:</strong><ul style="margin: 5px 0; padding-left: 20px;">${currentStrategy.psychologicalRules.customConditions.map(c => `<li>${c}</li>`).join('')}</ul></p>` : ''}
            ${currentStrategy.psychologicalRules.notes ? `<p class="summary-item"><strong>Notes:</strong> ${currentStrategy.psychologicalRules.notes}</p>` : ''}
        </div>
        
        ${currentStrategy.customRules.length > 0 ? `
        <div class="summary-section">
            <h3 class="summary-title inter-text">Custom Rules</h3>
            <ul style="margin: 5px 0; padding-left: 20px;">
                ${currentStrategy.customRules.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

// When moving to step 8 (summary), build the summary
function showSummaryStep() {
    // Save all current data first
    saveCurrentStepData();
    buildStrategySummary();
    document.getElementById("confirmation-checkbox").checked = false;
    document.getElementById("save-strategy-btn").disabled = true;
    
    // Enable save button when checkbox is checked
    document.getElementById("confirmation-checkbox").addEventListener("change", function() {
        document.getElementById("save-strategy-btn").disabled = !this.checked;
    });
}

function saveStrategy() {
    // Save current step data
    saveCurrentStepData();
    
    // Add current strategy to strategies array
    onboardingState.strategies.push({...currentStrategy});
    
    // Reset current strategy for next one
    currentStrategy = {
        name: "",
        description: "",
        entryRules: { criteria: [] },
        riskRules: { maxRiskPerTrade: { amount: "", type: "%" }, stopLossRequired: "", maxTradesPerDay: "", maxDailyLoss: { amount: "", type: "%" } },
        timeRules: { tradingHours: { start: "", end: "" }, daysOfWeek: [], newsRestrictions: false, newsNotes: "" },
        psychologicalRules: { avoidEmotions: [], avoidConditions: [], customConditions: [], notes: "" },
        customRules: []
    };
    
    // Move to "Add Another Strategy" step
    showStep(10);
}

function skipStrategy() {
    // Skip strategy creation - go to step 10 to ask if they want to create one later
    if (onboardingState.strategies.length === 0) {
        // No strategies yet, go to step 10
        showStep(10);
    } else {
        // They have strategies, go to step 10 to ask if they want to add another
        showStep(10);
    }
}

function addAnotherStrategy() {
    // Reset form fields
    document.getElementById("strategy-name").value = "";
    document.getElementById("strategy-description").value = "";
    document.getElementById("max-risk-amount").value = "";
    document.getElementById("stop-loss-required").value = "";
    document.getElementById("max-trades-day").value = "";
    document.getElementById("max-daily-loss-amount").value = "";
    document.getElementById("trading-start").value = "";
    document.getElementById("trading-end").value = "";
    document.getElementById("news-restrictions").checked = false;
    document.getElementById("news-notes").value = "";
    document.getElementById("psych-notes").value = "";
    document.getElementById("new-entry-criterion").value = "";
    document.getElementById("new-custom-condition").value = "";
    document.getElementById("new-custom-rule").value = "";
    
    // Reset checkboxes
    Array.from(document.querySelectorAll('input[name="trading-days"]')).forEach(cb => cb.checked = true);
    Array.from(document.querySelectorAll('input[name="avoid-emotions"]')).forEach(cb => cb.checked = false);
    Array.from(document.querySelectorAll('input[name="avoid-conditions"]')).forEach(cb => cb.checked = false);
    
    // Reset current strategy object
    currentStrategy = {
        name: "",
        description: "",
        entryRules: { criteria: [] },
        riskRules: { maxRiskPerTrade: { amount: "", type: "%" }, stopLossRequired: "", maxTradesPerDay: "", maxDailyLoss: { amount: "", type: "%" } },
        timeRules: { tradingHours: { start: "", end: "" }, daysOfWeek: [], newsRestrictions: false, newsNotes: "" },
        psychologicalRules: { avoidEmotions: [], avoidConditions: [], customConditions: [], notes: "" },
        customRules: []
    };
    
    // Go back to step 3
    showStep(3);
}

// Entry Criteria Management
function renderEntryCriteriaList() {
    const listEl = document.getElementById("entry-criteria-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    currentStrategy.entryRules.criteria.forEach((criterion, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${criterion}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeEntryCriterion(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addEntryCriterion() {
    const input = document.getElementById("new-entry-criterion");
    const value = input.value.trim();
    if (!value) return;
    
    currentStrategy.entryRules.criteria.push(value);
    input.value = "";
    renderEntryCriteriaList();
}

function removeEntryCriterion(index) {
    currentStrategy.entryRules.criteria.splice(index, 1);
    renderEntryCriteriaList();
}

// Custom Conditions Management
function renderCustomConditionsList() {
    const listEl = document.getElementById("custom-conditions-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    currentStrategy.psychologicalRules.customConditions.forEach((condition, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${condition}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeCustomCondition(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addCustomCondition() {
    const input = document.getElementById("new-custom-condition");
    const value = input.value.trim();
    if (!value) return;
    
    currentStrategy.psychologicalRules.customConditions.push(value);
    input.value = "";
    renderCustomConditionsList();
}

function removeCustomCondition(index) {
    currentStrategy.psychologicalRules.customConditions.splice(index, 1);
    renderCustomConditionsList();
}

// Custom Rules Management
function renderCustomRulesList() {
    const listEl = document.getElementById("custom-rules-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    currentStrategy.customRules.forEach((rule, index) => {
        const item = document.createElement("div");
        item.className = "criteria-item";
        item.innerHTML = `
            <span class="criteria-item-text inter-text">${rule}</span>
            <button type="button" class="criteria-item-remove inter-text" onclick="removeCustomRule(${index})">Remove</button>
        `;
        listEl.appendChild(item);
    });
}

function addCustomRule() {
    const input = document.getElementById("new-custom-rule");
    const value = input.value.trim();
    if (!value) return;
    
    currentStrategy.customRules.push(value);
    input.value = "";
    renderCustomRulesList();
}

function removeCustomRule(index) {
    currentStrategy.customRules.splice(index, 1);
    renderCustomRulesList();
}

async function finishOnboarding() {
    // Show loading state
    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
    
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Session expired. Please log in again.");
            window.location.href = "../Home/index.html";
            return;
        }
        
        const response = await fetch("https://complete-onboarding-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                tradingProfile: onboardingState.tradingProfile,
                strategies: onboardingState.strategies
            })
        });
        
        const result = await response.text();
        
        if (result === "Success") {
            // Update local client data
            await updateClientData();
            
            // Show completion step
            showStep(11);
        } else {
            alert(`Error saving onboarding data: ${result}`);
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error completing onboarding:", error);
        alert("Network error. Please try again.");
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

function goToDashboard() {
    // Hide wizard
    document.getElementById("onboarding-wizard").style.display = "none";
    
    // Hide full loader if still showing
    document.getElementById("dashboard-full-loader").style.display = "none";
    
    // Check membership and show subscription gate if Standard
    // This will be handled by dashboardINIT after reload
    location.reload();
}


