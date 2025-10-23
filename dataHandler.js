let clientData = null

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

async function getClientData() {
    if (localStorage.getItem("token") != null) {
        const request = window.indexedDB.open("clearentry", 3);
        request.onerror = (event) => {
            location.reload()
        }
        request.onsuccess = async (event) => {
            const db = event.target.result;

            if (db.objectStoreNames.contains("clientData")) {
                const tx = db.transaction("clientData", "readwrite");
                const store = tx.objectStore("clientData");

                clientData = store.get(localStorage.getItem("token"))
                tx.oncomplete = () => {
                    db.close();
                }
            } else {
                localStorage.removeItem("token")
                window.location.href = "../Landing/index.html"
            }
        }
    }

}


async function init() {
    if (localStorage.getItem("token") != null) {
        let data = await getData(localStorage.getItem("token"))
        data['token'] = localStorage.getItem("token")
        if (data) {
            const request = window.indexedDB.open("clearentry", 3);
            request.onerror = (event) => {
                location.reload()
            }
            request.onsuccess = async (event) => {
                const db = event.target.result;

                if (db.objectStoreNames.contains("clientData")) {
                    const tx = db.transaction("clientData", "readwrite");
                    const store = tx.objectStore("clientData");
                    store.put(data)

                    tx.oncomplete = () => {
                        db.close();
                    }
                } else {
                    localStorage.removeItem("token")
                    window.location.href = "../Landing/index.html"
                }
            }
        }
    }
}

init()