const ContinueButton = document.getElementById("ContinueButton")
const EmailInput = document.getElementById("EmailInput")
const PasswordInput = document.getElementById("PasswordInput")

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function login_request(Email, Password) {
    const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/login_request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: Email,
            password: Password
        })
    })

    const token = await response.text()

    return token
}

async function getData(token) {
    const response = await fetch("https://get-accountdata-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })

    return await response.json()
}

async function createData(data) {
    const deleteRequest = indexedDB.deleteDatabase("clearentry");
    const request = window.indexedDB.open("clearentry", 3);
    request.onerror = (event) => {
        location.reload()
    }

    request.onupgradeneeded = (event) => {
        const db = event.target.result;

        console.log("Check1")
        if (!db.objectStoreNames.contains("clientData")) {
            console.log("Check")
            db.createObjectStore("clientData", { keyPath: 'token' });
        }
    }

    request.onsuccess = async (event) => {
        const db = event.target.result;

        if (db.objectStoreNames.contains("clientData")) {
            const tx = db.transaction("clientData", "readwrite");
            const store = tx.objectStore("clientData");
            store.put(data)
            console.log(data)

            tx.oncomplete = () => {
                db.close();
            }
        }
    }
}


ContinueButton.addEventListener("click",  async function(){

    let Email = EmailInput.value 
    let Password = PasswordInput.value 
    let Token = await login_request(Email, Password)
    if (Token != null && Token != "Invalid Email" && Token != "Invalid Password") {
        localStorage.setItem("token", Token)
        const clientData = await getData(Token)
        clientData['token'] = Token
        await createData(clientData)
        await sleep(500)
        window.location.href = "../Dashboard/dashboard.html"

    }
})
