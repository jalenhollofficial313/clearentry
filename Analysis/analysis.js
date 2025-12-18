

let generating = false

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ai_Request(token) {
    const response = await fetch("https://ai-reflection-request-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
        })
    })

    return await response.json()
}


async function textAnimation(p) {


    while (generating == true) {
        await sleep(200)
        if (p.innerHTML.length >= 13) {
            p.innerHTML = "Genearting"
        } else {
            p.innerHTML = p.innerHTML + "."
        }
    }
}

document.querySelector("#generate-button").addEventListener("click", async function() {
    if (Math.abs(Math.floor(Date.now() / 1000) - clientData.result['dayLog']) < 86400) {
        document.querySelector("#generate-text").innerHTML = "On Cooldown"
        await sleep(2000)
        document.querySelector("#generate-text").innerHTML = "Generate Plan"
    } else {
        generating = true
        textAnimation(document.querySelector("#generate-text"))
        const data = await ai_Request(localStorage.getItem("token"))
        if (data) {
            generating = false

            document.querySelector("#strategy-summary").innerHTML = data['strategy_summary']['text']
            document.querySelector("#emotion-summary").innerHTML = data['emotion_pattern']['text']
            document.querySelector("#symbol-summary").innerHTML = data['symbol_insight']['text']
            document.querySelector("#focus-summary").innerHTML = data['focus_advice']['text']
            document.querySelector("#avoid-summary").innerHTML = data['avoid_advice']['text']

            document.querySelector("#symbol-advice").innerHTML = data['quick_advices'][0]['text']
            document.querySelector("#strategy-advice").innerHTML = data['quick_advices'][1]['text']
            document.querySelector("#emotion-advice").innerHTML = data['quick_advices'][2]['text']
            document.querySelector("#general-advice").innerHTML = data['quick_advices'][3]['text']

            document.querySelector("#win-rate").innerHTML = data['target_metrics']['win_rate']
            document.querySelector("#avg-profit").innerHTML = data['target_metrics']['avg_profit']
            document.querySelector("#emotional-state").innerHTML = data['target_metrics']['emotional_state']
            document.querySelector("#trades-amount").innerHTML = data['target_metrics']['trades_per_day']

            await sleep(200)
            document.querySelector("#generate-text").innerHTML = "Generate Plan"
            document.querySelector("#reflection-div").style.display = "block"
        }
    }
    
})

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-click").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
});

async function init() {
    await getClientData()
    await sleep(100)

    // Check membership and show paywall if Standard
    const membership = clientData.result['membership']
    const paywallOverlay = document.getElementById('paywall-overlay')
    const mainContent = document.getElementById('frame-1')
    const reflectionDiv = document.getElementById('reflection-div')
    
    if (membership !== 'Pro') {
        // Show paywall overlay
        if (paywallOverlay) {
            paywallOverlay.style.display = 'flex'
        }
        // Hide main content
        if (mainContent) {
            mainContent.style.display = 'none'
        }
        if (reflectionDiv) {
            reflectionDiv.style.display = 'none'
        }
    } else {
        // Hide paywall for Pro members
        if (paywallOverlay) {
            paywallOverlay.style.display = 'none'
        }
        // Show main content
        if (mainContent) {
            mainContent.style.display = 'block'
        }
    }
}

init()