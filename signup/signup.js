const ContinueButton = document.getElementById("ContinueButton")
const EmailInput = document.getElementById("EmailInput")
const PasswordInput = document.getElementById("PasswordInput")
const NameInput = document.getElementById("NameInput")
const ReferalInput = document.getElementById("ReferalInput")

async function signup_request(Name, Email, Password, ReferalCode) {
    const response = await fetch("https://add-account-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: Name,
            email: Email,
            password: Password,
            referal: ReferalCode
        })
    });

    const data = await response.text();
    console.log(data)

    if (data !== "Invalid Email") {
        localStorage.setItem("token", data);
        return data; 
    } else {
        return null;
    }
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
    const request = window.indexedDB.open("clearentry", 3);
    request.onerror = (event) => {
        location.reload()
    }
    request.onupgradeneeded = async (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("clientData")) {
            db.createObjectStore("clientData", { keyPath: 'email' });
        }
    };

    request.onsuccess = async (event) => {
        const db = event.target.result;

        const tx = db.transaction("clientData", "readwrite");
        const store = tx.objectStore("clientData");
        store.put(data)
        console.log(data)

        tx.oncomplete = () => {
            db.close();
        }
    }
}


ContinueButton.addEventListener("click",  async function(){
    let Name = NameInput.value
    let Email = EmailInput.value 
    let Password = PasswordInput.value 
    let referal = ReferalInput.value
    let Token = await signup_request(Name, Email, Password, referal)
    if (Token != null && Token != "Invalid Email" && Token != "Invalid Password") {
        localStorage.setItem("token", Token)
        const clientData = await getData(Token)
        await createData(clientData)
        window.location.href = '../Dashboard/dashboard.html';
    }
})
