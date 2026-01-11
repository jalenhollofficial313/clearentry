const fileInput = document.querySelector("#tradeImageInput")


let debounce = false
let tradeLogged = false
let linkedPreTradeSessionId = null
let linkedPreTradeSession = null
let recentPreTrades = []
let ruleComplianceData = null
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
            PL: Number(document.querySelector("#entry-PL").value),
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

// Function to process an image file (extracted for reuse)
async function processImageFile(file) {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        alert('Invalid image format. Please use PNG, JPG, or JPEG images.');
        return;
    }

    document.querySelector("#img_Input").style.display = "none"
    document.querySelector("#img-analyze").style.display = "block";
    initAnalyzer()
    
    document.querySelector("#img_Frame").src = URL.createObjectURL(file);
    tradeEntry['img'] = await toBase64(file)
    
    const analyzedData = await analyzeIMG(localStorage.getItem("token"), tradeEntry['img'])
    
    // Handle new format with extracted data
    const dataToProcess = analyzedData.extracted || analyzedData;
    
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
                alert('Invalid image format. Please paste PNG, JPG, or JPEG images only.');
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
    // Clear mental state dropdown
    const children = Array.from(document.querySelector("#mental-dropdown").children);
    for (let child of children) {
        child.remove();
    }

    document.querySelector("#entry-SYMBOL").value = ""
    document.querySelector("#entry-PL").value = ""
    document.querySelector("#entry-notes").value = ""

    const emotions = clientData.result['emotions']
    for (let emotion in emotions) {
        const button = document.createElement("button")
        button.innerHTML = emotions[emotion]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        button.addEventListener("click", function() {
            tradeEntry['emotion'] = emotions[emotion]
            document.querySelector("#state-text").innerHTML = emotions[emotion]
        })
        document.querySelector("#mental-dropdown").appendChild(button)
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

            // Update display fields (not dropdowns)
            const typeDisplay = document.getElementById("type-display")
            const directionDisplay = document.getElementById("direction-display")
            const strategyDisplay = document.getElementById("strategy-display")
            
            if (typeDisplay) typeDisplay.textContent = trade['type'] || "-"
            if (directionDisplay) directionDisplay.textContent = trade['direction'] || "-"
            if (strategyDisplay) {
                if (trade['strategy'] && trade['strategy'].length > 0) {
                    strategyDisplay.textContent = trade['strategy'].join(", ")
                } else {
                    strategyDisplay.textContent = "-"
                }
            }
            
            document.querySelector("#state-text").innerHTML = trade['emotion'] || "State"
            document.querySelector("#entry-SYMBOL").value = trade['symbol']
            document.querySelector("#entry-PL").value = trade['PL']
            
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

            // Show type/direction row when viewing existing trade
            const typeDirectionRow = document.getElementById("type-direction-row")
            if (typeDirectionRow) typeDirectionRow.style.display = "flex"

            if (trade['type'] == "Options") {
                document.querySelector("#options-data").style.display = "block"
            }
            
            // Update continue button state (enabled for editing existing trades)
            updateContinueButtonState();

        } catch (error) {
            console.log("Error occured, trade ID most likely invalid")
        }
    }
    
    // Note: Strategy is now display-only, populated from pre-trade sessions
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
                        token: localStorage.getItem("token"),
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
                        token: localStorage.getItem("token"),
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

document.querySelector("#state-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#mental-dropdown").style.display == "block") {
        document.querySelector("#mental-dropdown").style.display = "none"
    } else {
        document.querySelector("#mental-dropdown").style.display = "block"
    }
})

// Strategy dropdown removed - now display-only, populated from pre-trade sessions

// Type and Direction dropdowns removed - now populated from pre-trade sessions




document.querySelector("#mental-settings-button").addEventListener("click", async function(){
    document.querySelector("#strategy-settings").style.display = "none"
    document.querySelector("#settings-div").style.display = "block"
    document.querySelector("#mental-settings").style.display = "block"
})


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
                    token: localStorage.getItem("token"),
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
                                token: localStorage.getItem("token"),
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
                    token: localStorage.getItem("token"),
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
                                token: localStorage.getItem("token"),
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
                
                // Add to emotions dropdown (mental-dropdown)
                const emotionButton = document.createElement("button")
                emotionButton.innerHTML = emotionValue
                emotionButton.classList.add("dropdown-item")
                emotionButton.classList.add("inter-text")

                emotionButton.addEventListener("click", function() {
                    tradeEntry['emotion'] = emotionValue
                    document.querySelector("#state-text").innerHTML = emotionValue
                })
                document.querySelector("#mental-dropdown").appendChild(emotionButton)
                
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
            token: localStorage.getItem("token"),
            trade_id: tradeEntry['id'],
            emotion: tradeEntry['emotion'],
            strategy: tradeEntry['strategy'],
            symbol: document.querySelector("#entry-SYMBOL").value,
            notes: document.querySelector("#entry-notes").value,
            PL: Number(document.querySelector("#entry-PL").value),
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
    // Require pre-trade session for new trades
    if (tradeEntry['id'] == "" && !linkedPreTradeSessionId) {
        alert("Please select a Pre-Trade Session before logging a trade.");
        return;
    }
    
    client_server_debounce = true
    if (tradeEntry['id'] == "") {
        loadingFrame(1000, "Logging Entry...", "Entry Logged.")
        const tradeId = await log_Trade(localStorage.getItem("token"))
        client_server_debounce = false
        
        // Show ranking modal for new trade
        if (tradeId && tradeId !== "Token Error") {
            await sleep(500)
            showRankingModal(tradeId)
        } else {
            await sleep(500)
            location.href = "../TradeLogging/tradelogging.html";
        }
    } else {
        loadingFrame(1000, "Updating Entry...", "Entry Updated.")
        await saveTrade()
        client_server_debounce = false
        await sleep(500)
        location.href = "../TradeLogging/tradelogging.html";
    }
})

document.querySelector("#cancel-button").addEventListener("click", function() {
    location.href = "../TradeLogging/tradelogging.html";
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
                token: localStorage.getItem("token"),
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
            alert("Failed to save rank. Please try again.");
        }
    } catch (error) {
        client_server_debounce = false;
        this.disabled = false;
        console.error("Error saving rank:", error);
        alert("An error occurred. Please try again.");
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
        alert("Please answer all required questions before submitting.");
        return;
    }
    
    // If "Other" was selected for entry reason, require the text
    if (reflectionData.primaryEntryReason === "other-entry" && !reflectionData.entryReasonOtherText) {
        alert("Please describe your entry reason.");
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
                token: localStorage.getItem("token"),
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
                location.href = "../TradeLogging/tradelogging.html";
            }
        } else {
            client_server_debounce = false;
            this.disabled = false;
            console.error("Failed to save reflection:", result);
            alert("Failed to save reflection. Please try again.");
        }
    } catch (error) {
        client_server_debounce = false;
        this.disabled = false;
        console.error("Error saving reflection:", error);
        alert("An error occurred. Please try again.");
    }
});

// Skip reflection button handler
document.getElementById("reflection-skip").addEventListener("click", async function() {
    hideReflectionModal();
    await updateClientData();
    await sleep(100);
    location.href = "../TradeLogging/tradelogging.html";
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

function showAIInsights(insightText) {
    const modal = document.getElementById("ai-insights-modal");
    const insightElement = document.getElementById("ai-insights-text");
    
    // Clear the element first
    insightElement.textContent = "";
    modal.style.display = "flex";
    lucide.createIcons();
    
    // Animate text appearance (typewriter effect)
    animateTextAppearance(insightElement, insightText);
}

// Function to animate text appearance (typewriter effect)
async function animateTextAppearance(element, text) {
    const speed = 20; // milliseconds per character
    
    for (let i = 0; i <= text.length; i++) {
        const currentText = text.substring(0, i);
        element.textContent = currentText;
        
        if (i < text.length) {
            await sleep(speed);
        }
    }
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
                token: localStorage.getItem("token"),
                tradeId: tradeId
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.insight) {
            progressBar.style.width = "100%";
            stepText.textContent = "Complete!";
            await sleep(500);
            
            hideAIAnalysisLoading();
            showAIInsights(result.insight);
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
    location.href = "../TradeLogging/tradelogging.html";
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
    const typeDisplay = document.getElementById("type-display");
    const directionDisplay = document.getElementById("direction-display");
    const strategyDisplay = document.getElementById("strategy-display");
    const optionsDataSection = document.getElementById("options-data");
    
    // Auto-fill symbol (read-only when linked)
    if (linkedPreTradeSession.symbol) {
        symbolInput.value = linkedPreTradeSession.symbol;
        symbolInput.readOnly = true;
        symbolInput.style.backgroundColor = "#16181d";
        symbolInput.style.cursor = "not-allowed";
    }
    
    // Auto-fill type (read-only display)
    if (linkedPreTradeSession.type) {
        tradeEntry['type'] = linkedPreTradeSession.type;
        if (typeDisplay) {
            typeDisplay.textContent = linkedPreTradeSession.type;
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
    
    // Auto-fill direction (read-only display)
    if (linkedPreTradeSession.direction) {
        tradeEntry['direction'] = linkedPreTradeSession.direction;
        if (directionDisplay) {
            directionDisplay.textContent = linkedPreTradeSession.direction;
        }
    }
    
    // Auto-fill strategy (read-only display)
    if (linkedPreTradeSession.strategyName) {
        tradeEntry['strategy'] = [linkedPreTradeSession.strategyName];
        if (strategyDisplay) {
            strategyDisplay.textContent = linkedPreTradeSession.strategyName;
        }
    }
    
    // Note: Mental state is NOT auto-filled - user selects post-trade mental state
}

// Reset fields when unlinked
function resetFieldsAfterUnlink() {
    const symbolInput = document.querySelector("#entry-SYMBOL");
    const typeDisplay = document.getElementById("type-display");
    const directionDisplay = document.getElementById("direction-display");
    const strategyDisplay = document.getElementById("strategy-display");
    const optionsDataSection = document.getElementById("options-data");
    
    if (symbolInput) {
        symbolInput.readOnly = false;
        symbolInput.style.backgroundColor = "";
        symbolInput.style.cursor = "";
        symbolInput.value = "";
    }
    
    if (typeDisplay) typeDisplay.textContent = "-";
    if (directionDisplay) directionDisplay.textContent = "-";
    if (strategyDisplay) strategyDisplay.textContent = "-";
    
    if (optionsDataSection) optionsDataSection.style.display = "none";
    
    // Reset tradeEntry
    tradeEntry['type'] = "";
    tradeEntry['direction'] = "";
    tradeEntry['strategy'] = [];
}

// Update Continue button state based on pre-trade session
function updateContinueButtonState() {
    const continueButton = document.getElementById("continue-button");
    if (!continueButton) return;
    
    // Only disable for new trades (not when editing existing trade)
    if (tradeEntry['id'] == "" && !linkedPreTradeSessionId) {
        continueButton.disabled = true;
        continueButton.style.opacity = "0.5";
        continueButton.style.cursor = "not-allowed";
    } else {
        continueButton.disabled = false;
        continueButton.style.opacity = "1";
        continueButton.style.cursor = "pointer";
    }
}

// Update Pre-Trade UI
function updatePreTradeUI() {
    const typeDirectionRow = document.getElementById("type-direction-row");
    const unlinkButton = document.getElementById("unlink-pretrade-btn");
    
    if (linkedPreTradeSessionId && linkedPreTradeSession) {
        // Linked state - show type/direction as read-only displays
        if (typeDirectionRow) typeDirectionRow.style.display = "flex";
        
        // Show info section and unlink button
        if (unlinkButton) unlinkButton.style.display = "block";
        
        // Update pretrade info display
        const typeDisplay = document.getElementById("pretrade-type-display");
        const symbolDisplay = document.getElementById("pretrade-symbol-display");
        const directionDisplay = document.getElementById("pretrade-direction-display");
        const strategyDisplay = document.getElementById("pretrade-strategy-display");
        
        if (typeDisplay) typeDisplay.textContent = linkedPreTradeSession.type || "N/A";
        if (symbolDisplay) symbolDisplay.textContent = linkedPreTradeSession.symbol || "N/A";
        if (directionDisplay) directionDisplay.textContent = linkedPreTradeSession.direction || "N/A";
        if (strategyDisplay) strategyDisplay.textContent = linkedPreTradeSession.strategyName || "N/A";
        
        const warningBadge = document.getElementById("pretrade-warning-badge");
        if (warningBadge) {
            if (linkedPreTradeSession.proceededWithViolations) {
                warningBadge.style.display = "inline-block";
            } else {
                warningBadge.style.display = "none";
            }
        }
        
        // Update dropdown button text
        const timeStr = linkedPreTradeSession.time || new Date(linkedPreTradeSession.createdAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const pretradeText = document.getElementById("pretrade-text");
        if (pretradeText) {
            pretradeText.innerHTML = `${timeStr} - ${linkedPreTradeSession.symbol || ""} ${linkedPreTradeSession.direction || ""}`;
        }
    } else {
        // Not linked state - hide type/direction row
        if (typeDirectionRow) typeDirectionRow.style.display = "none";
        
        // Hide info section and unlink button when not linked
        if (unlinkButton) unlinkButton.style.display = "none";
        
        const pretradeText = document.getElementById("pretrade-text");
        if (pretradeText) {
            pretradeText.innerHTML = "Select a Pre-Trade";
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
        badge.textContent = "✓ Rule-Following";
    } else if (compliance.status === "rule-breaking") {
        badge.style.backgroundColor = "rgba(255, 23, 68, 0.2)";
        badge.style.color = "#ff1744";
        badge.textContent = "⚠ Rule-Breaking";
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
    // Initialize pre-trade UI
    await getClientData()
    await sleep(100)

    console.log(clientData.result)
    
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
