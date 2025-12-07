const fileInput = document.querySelector("#tradeImageInput")


let debounce = false
let tradeLogged = false
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
            IV: Number(document.querySelector("#entry-IV").value)
        })
    });

    return await response.text()
}

async function analyzeIMG(token, img) {
    const response = await fetch("https://imgreading-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token,
            img: img,
        })
    });

    data = await response.json()
    console.log(data)
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

fileInput.addEventListener("change", async function() {
    const file = fileInput.files[0];
    if (!file) return;


    document.querySelector("#img_Input").style.display = "none"
    document.querySelector("#img-analyze").style.display = "block";
    initAnalyzer()
    
    document.querySelector("#img_Frame").src = URL.createObjectURL(file);
    if (fileInput.files.length > 0) {
        tradeEntry['img'] = await toBase64(fileInput.files[0])
    }
    const analyzedData = await analyzeIMG(localStorage.getItem("token"), tradeEntry['img'])
    for (let key in analyzedData) {
        console.log(key)
        tradeEntry[key] = analyzedData[key]
        if (key == "saved_img") {
            console.log(analyzedData[key])
            continue
        }
        document.querySelector(`#entry-${key}`).value = analyzedData[key]
    }
    document.querySelector("#img-analyze").style.display = "none";
    document.querySelector("#img_Frame").style.display = "block";
});

async function reloadPage() {
    
    const children = Array.from(document.querySelector("#mental-dropdown").children);
    const children2 = Array.from(document.querySelector("#strategy-dropdown").children);

    for (let child of children) {
        child.remove();
    }
    for (let child of children2) {
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

            document.querySelector("#type-text").innerHTML = trade['type'] || "Type"
            document.querySelector("#direction-text").innerHTML = trade['direction'] || "Direction"
            document.querySelector("#state-text").innerHTML = trade['emotion'] || "State"
            document.querySelector("#entry-SYMBOL").value = trade['symbol']
            document.querySelector("#entry-PL").value = trade['PL']
            document.querySelector("#entry-RR").value = trade['RR']
            document.querySelector("#entry-Delta").value = trade['Delta']
            document.querySelector("#entry-Gamma").value = trade['Gamma']
            document.querySelector("#entry-Theta").value = trade['Theta']
            document.querySelector("#entry-IV").value = trade['IV']
            document.querySelector("#entry-Rho").value = trade['Rho']
            document.querySelector("#entry-Vega").value = trade['Vega']
            document.querySelector("#entry-notes").value = trade['notes']

            if (trade['type'] == "Options") {
                document.querySelector("#options-data").style.display = "block"
            }

        } catch (error) {
            console.log("Error occured, trade ID most likely invalid")
        }
    }

    const strategies = clientData.result['strategies']
    for (let strategy in strategies) {
        const button = document.createElement("button")
        button.innerHTML = strategies[strategy]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        if (trade != null && trade['strategy'].includes(strategies[strategy])) {
            button.classList.add("selected-dropdown")
            let textContent = ""
            trade['strategy'].forEach(function(value, index) {
                textContent = textContent + value + ", "
            })
            document.querySelector("#confluences-text").innerHTML = textContent
        }

        button.addEventListener("click", async function() {
            if (debounce == true) {
                return
            }
            debounce = true
            if (tradeEntry['strategy'].includes(strategies[strategy])) {
                button.classList.remove("selected-dropdown")
                if (tradeEntry['strategy'].length == 1) {
                    tradeEntry['strategy'] = []
                } else {
                    tradeEntry['strategy'].splice(tradeEntry['strategy'].indexOf(strategies[strategy]), tradeEntry['strategy'].indexOf(strategies[strategy]) + 1)
                }
            } else {
                button.classList.add("selected-dropdown")
                tradeEntry['strategy'].push(strategies[strategy])
            }

            if (tradeEntry['strategy'].length == 0) {
                document.querySelector("#confluences-text").innerHTML = "Confluences"
            } else if (tradeEntry['strategy'].length > 0) {
                let textContent = ""
                tradeEntry['strategy'].forEach(function(value, index) {
                    textContent = textContent + value + ", "
                })
                document.querySelector("#confluences-text").innerHTML = textContent
            }
            await sleep(250)
            debounce = false
        })
        document.querySelector("#strategy-dropdown").appendChild(button)
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

    const long = document.createElement("button");
    long.classList.add("inter-text");
    long.classList.add("dropdown-item");
    long.id = "long-button"
    long.innerHTML = "Long"

    
    const short = document.createElement("button");
    short.classList.add("inter-text");
    short.classList.add("dropdown-item");
    short.id = "short-button"
    short.innerHTML = "Short"

    long.addEventListener("click", async function() {
        document.querySelector("#direction-dropdown").style.display = "none"
        tradeEntry['direction'] = "Long"
        document.querySelector("#direction-text").innerHTML = "Long"
    })


    short.addEventListener("click", async function() {
        document.querySelector("#direction-dropdown").style.display = "none"
        tradeEntry['direction'] = "Short"
        document.querySelector("#direction-text").innerHTML = "Short"
    })

    const options = document.createElement("button");
    options.classList.add("inter-text");
    options.classList.add("dropdown-item");
    options.id = "options-button"
    options.innerHTML = "Options"

    
    const futures = document.createElement("button");
    futures.classList.add("inter-text");
    futures.classList.add("dropdown-item");
    futures.id = "futures-button"
    futures.innerHTML = "Futures"

    options.addEventListener("click", async function() {
        document.querySelector("#type-dropdown").style.display = "none"
        tradeEntry['type'] = "Options"
        document.querySelector("#type-text").innerHTML = "Options"

        document.querySelector("#options-data").style.display = "block"
    })



    futures.addEventListener("click", async function() {
        document.querySelector("#type-dropdown").style.display = "none"
        tradeEntry['type'] = "Futures"
        document.querySelector("#type-text").innerHTML = "Futures"
        document.querySelector("#options-data").style.display = "none"
    })

    document.querySelector("#type-dropdown").appendChild(options);
    document.querySelector("#type-dropdown").appendChild(futures);
    document.querySelector("#direction-dropdown").appendChild(long);
    document.querySelector("#direction-dropdown").appendChild(short);



    const emotions = clientData.result['emotions']
    for (let emotion in emotions) {
        const item = document.createElement("p")
        item.innerHTML = emotions[emotion]
        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon")

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");

        span.appendChild(icon)
        item.appendChild(span)

        span.addEventListener("click", function() {
            console.log("Check")
            item.remove()
            const response = fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    emotion: emotions[emotion],
                })
            })
        })
        document.querySelector("#mental-settings-dropdown").appendChild(item)
    }


    const strategies = clientData.result['strategies']
    for (let strategy in strategies) {
        const item = document.createElement("p")
        item.innerHTML = strategies[strategy]
        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon")

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");


        span.appendChild(icon)
        item.appendChild(span)

        span.addEventListener("click", function() {
            console.log("Check")
            item.remove()
            const response = fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    strategy: strategies[strategy],
                })
            })
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

document.querySelector("#strategy-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#strategy-dropdown").style.display == "block") {
        document.querySelector("#strategy-dropdown").style.display = "none"
    } else {
        document.querySelector("#strategy-dropdown").style.display = "block"
    }
})

document.querySelector("#direction-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#direction-dropdown").style.display == "block") {
        document.querySelector("#direction-dropdown").style.display = "none"
    } else {
        document.querySelector("#direction-dropdown").style.display = "block"
    }
})

document.querySelector("#type-dropdown-button").addEventListener("click", async function() {
    if (document.querySelector("#type-dropdown").style.display == "block") {
        document.querySelector("#type-dropdown").style.display = "none"
    } else {
        document.querySelector("#type-dropdown").style.display = "block"
    }
})




document.querySelector("#mental-settings-button").addEventListener("click", async function(){
    document.querySelector("#strategy-settings").style.display = "none"
    document.querySelector("#settings-div").style.display = "block"
    document.querySelector("#mental-settings").style.display = "block"
})

document.querySelector("#strategy-settings-button").addEventListener("click", async function(){
    document.querySelector("#mental-settings").style.display = "none"
    document.querySelector("#settings-div").style.display = "block"
    document.querySelector("#strategy-settings").style.display = "block"
})

for (let i = 0; i < document.querySelectorAll(".close-settingsbutton").length; i++) {
    document.querySelectorAll(".close-settingsbutton")[i].addEventListener("click", function(){
        document.querySelector("#mental-settings").style.display = "none"
        document.querySelector("#settings-div").style.display = "none"
        document.querySelector("#strategy-settings").style.display = "none"
    })
}

document.querySelector("#strategy-add").addEventListener("click", function() {
    if (document.querySelector("#strategy-input").value != "" && document.querySelector("#strategy-input").value != null) {
        const response = fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                strategy: document.querySelector("#strategy-input").value,
            })
        })

        const strategyValue = document.querySelector("#strategy-input").value
        const item = document.createElement("p")
        item.innerHTML = strategyValue
        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon")

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");


        span.appendChild(icon)
        item.appendChild(span)

        span.addEventListener("click", function() {
            item.remove()
            const response = fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    strategy: strategyValue,
                })
            })
        })
        document.querySelector("#strategy-settings-dropdown").appendChild(item)
        lucide.createIcons();
        
    }

    document.querySelector("#strategy-input").value = ""
})

document.querySelector("#emotion-add").addEventListener("click", function() {
    if (document.querySelector("#emotion-input").value != "" && document.querySelector("#emotion-input").value != null) {
        const response = fetch("https://add-emotion-strategy-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                emotion: document.querySelector("#emotion-input").value,
            })
        })

        const emotionValue = document.querySelector("#emotion-input").value
        const item = document.createElement("p")
        item.innerHTML = emotionValue
        item.classList.add("settings-listitem")
        item.classList.add("inter-text")

        const span = document.createElement("span")
        span.classList.add("dropdown-icon")

        const icon = document.createElement("i")
        icon.classList.add("icon2")
        icon.classList.add("close-icon")
        icon.classList.add("remove-icon")
        icon.setAttribute("data-lucide", "x");


        span.appendChild(icon)
        item.appendChild(span)

        span.addEventListener("click", function() {
            item.remove()
            const response = fetch("https://remove-emotion-strategy-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: localStorage.getItem("token"),
                    emotion: emotionValue,
                })
            })
        })
        document.querySelector("#mental-settings-dropdown").appendChild(item)
        lucide.createIcons();
        
    }

    document.querySelector("#emotion-input").value = ""
})

async function saveTrade() {
    console.log(document.querySelector("#entry-notes").value)
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
    client_server_debounce = true
    if (tradeEntry['id'] == "") {
        loadingFrame(1000, "Logging Entry...", "Entry Logged.")
        await log_Trade(localStorage.getItem("token"))
        client_server_debounce = false        
    } else {
        loadingFrame(1000, "Updating Entry...", "Entry Updated.")
        await saveTrade()
        client_server_debounce = false
    }

    await sleep(500)
    location.reload()

})

document.querySelector("#cancel-button").addEventListener("click", function() {
    location.reload()
})


document.addEventListener("DOMContentLoaded", () => {
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
    await getClientData()
    await sleep(100)
    
    reloadPage()
    loadDropDowns()
}



logINIT();
