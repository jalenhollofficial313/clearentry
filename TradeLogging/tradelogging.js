const fileInput = document.querySelector("#tradeImageInput")


let tradeLogged = false
let tradeEntry = {
    ['id']: "",
    ['emotion']: "",
    ['strategy']: "",
    ['symbol']: "",
    ['notes']: "",
    ['pl']: "",
    ['img']: ""
}

function sleep(ms) {
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
            symbol: document.querySelector("#entry-symbol").value,
            trade_notes: document.querySelector("#entry-notes").value,
            PL: Number(document.querySelector("#entry-pl").value),
            img: tradeEntry['img'] 
        })
    });

    return await response.text()
}

async function add_Emotion(token, emotionvalue) {
     const response = await fetch("https://add-emotion-b52ovbio5q-uc.a.run.app", {
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


fileInput.addEventListener("change", async function() {
    const file = fileInput.files[0];
    if (!file) return;


    document.querySelector("#img_Input").style.display = "none"
    document.querySelector("#img_Frame").style.display = "block";
    document.querySelector("#img_Frame").src = URL.createObjectURL(file);

    if (fileInput.files.length > 0) {
        tradeEntry['img'] = await toBase64(fileInput.files[0])
    }
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

    document.querySelector("#entry-symbol").value = ""
    document.querySelector("#entry-pl").value = ""
    document.querySelector("#entry-notes").value = ""

    const emotions = clientData.result['emotions']
    for (let emotion in emotions) {
        const button = document.createElement("button")
        button.innerHTML = emotions[emotion]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        button.addEventListener("click", function() {
            tradeEntry['emotion'] = emotions[emotion]
            document.querySelector("#state-dropdown-button").childNodes[0].textContent = emotions[emotion]
        })
        document.querySelector("#mental-dropdown").appendChild(button)
    }

    const strategies = clientData.result['strategies']
    for (let strategy in strategies) {
        const button = document.createElement("button")
        button.innerHTML = strategies[strategy]
        button.classList.add("dropdown-item")
        button.classList.add("inter-text")

        button.addEventListener("click", function() {
            tradeEntry['strategy'] = strategies[strategy]
            document.querySelector("#strategy-dropdown-button").childNodes[0].textContent = strategies[strategy]
        })
        document.querySelector("#strategy-dropdown").appendChild(button)
    }
}

async function loadDropDowns(params) {
    const children = Array.from(document.querySelector("#mental-settings-dropdown").children);
    const children2 = Array.from(document.querySelector("#strategy-settings-dropdown").children);

    for (let child of children) {
        child.remove();
    }
    for (let child of children2) {
        child.remove();
    }


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

document.querySelector("#continue-button").addEventListener("click", async function() {
    await log_Trade(localStorage.getItem("token"))
    location.reload()
})

document.querySelector("#cancel-button").addEventListener("click", function() {
    location.reload()
})


async function logINIT() {
    await getClientData()
    await sleep(100)
    
    reloadPage()
    loadDropDowns()
}


logINIT();
