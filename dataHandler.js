let clientData = null

function showTokenFailureNotification() {
    // Create notification element if it doesn't exist
    let notification = document.getElementById("token-failure-notification")
    if (!notification) {
        notification = document.createElement("div")
        notification.id = "token-failure-notification"
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff4444;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 100000;
            font-family: "Inter", sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `
        document.body.appendChild(notification)
        
        // Add animation keyframes if not already in document
        if (!document.getElementById("token-notification-styles")) {
            const style = document.createElement("style")
            style.id = "token-notification-styles"
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `
            document.head.appendChild(style)
        }
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="flex: 1;">
                <strong>Session Expired</strong>
                <div style="margin-top: 4px; font-size: 13px; opacity: 0.9;">
                    Please log in again to continue using ClearEntry.
                </div>
            </div>
        </div>
    `
    notification.style.display = "block"
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease-out"
        setTimeout(() => {
            notification.style.display = "none"
        }, 300)
    }, 3000)
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

    const responseText = await response.text()
    
    // Check if response is "Invalid Token"
    if (responseText === "Invalid Token") {
        showTokenFailureNotification()
        localStorage.removeItem("token")
        resetDataBase() // Don't await - let it run in background
        setTimeout(() => {
            window.location.href = "../Home/index.html"
        }, 2000)
        return null
    }
    
    try {
        return JSON.parse(responseText)
    } catch (e) {
        // If it's not JSON and not "Invalid Token", return the text
        return responseText
    }
}

async function getClientData() {
    if (localStorage.getItem("token") != null) {
        const request = window.indexedDB.open("clearentry", 3);
        request.onerror = (event) => {
            location.reload()
        }

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("clientData")) {
                db.createObjectStore("clientData", { keyPath: "token" });
            }
        };

        request.onsuccess = async (event) => {
            const db = event.target.result;

            if (db.objectStoreNames.contains("clientData")) {
                const tx = db.transaction("clientData", "readwrite");
                const store = tx.objectStore("clientData");

                clientData = await store.get(localStorage.getItem("token"))
                tx.oncomplete = () => {
                    db.close();
                }
            } else {
                await resetDataBase()
                localStorage.removeItem("token")
                window.location.href = "../Home/index.html"
            }
        }
    } else {
        localStorage.removeItem("token")
        window.location.href = "../Home/index.html"
    }
}

async function updateClientData() {
    if (localStorage.getItem("token") != null) {
        let data = await getData(localStorage.getItem("token"))
        if (!data || data === "Invalid Token") {
            return
        }
        data['token'] = localStorage.getItem("token")
        if (data) {
            const request = window.indexedDB.open("clearentry", 3);
            request.onerror = (event) => {
                location.reload()
            }
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("clientData")) {
                    db.createObjectStore("clientData", { keyPath: "token" });
                }
            };
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
                    await resetDataBase()
                    localStorage.removeItem("token")
                    window.location.href = "../Home/index.html"
                }
            }
        }
    } else {
        localStorage.removeItem("token")
        window.location.href = "../Home/index.html"
    }
}
async function dataErrorHandling(params) {
    if (clientData == null) {
        localStorage.removeItem("token")
        window.location.href = "../Home/index.html"
    }
}


async function resetDataBase(params) {
    const deleteRequest = window.indexedDB.deleteDatabase("clearentry");

    deleteRequest.onsuccess = function () {
        console.log("Database deleted successfully");
    };

    deleteRequest.onerror = function () {
        console.log("Error deleting database");
    };

    deleteRequest.onblocked = function () {
        console.log("Delete blocked—close all tabs using the DB");
    };
}


async function init() {
    if (localStorage.getItem("token") != null) {
        let data = await getData(localStorage.getItem("token"))
        if (!data || data === "Invalid Token") {
            return
        }
        data['token'] = localStorage.getItem("token")
        if (data) {
            const request = window.indexedDB.open("clearentry", 3);
            request.onerror = (event) => {
                location.reload()
            }
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("clientData")) {
                    db.createObjectStore("clientData", { keyPath: "token" });
                }
            };
            request.onsuccess = async (event) => {
                const db = event.target.result;

                if (db.objectStoreNames.contains("clientData")) {
                    const tx = db.transaction("clientData", "readwrite");
                    const store = tx.objectStore("clientData");
                    store.put(data)


                    tx.oncomplete = () => {
                        db.close();
                    }
                    
                    // Check membership and redirect Standard users to dashboard
                    const membership = data?.result?.membership || data?.membership || "Standard";
                    const isPro = membership.toLowerCase() === "pro";
                    const currentPath = window.location.pathname;
                    const isDashboard = currentPath.includes("dashboard.html");
                    
                    // If user is Standard and not on dashboard, redirect to dashboard
                    if (!isPro && !isDashboard && !currentPath.includes("Home") && !currentPath.includes("login") && !currentPath.includes("signup")) {
                        window.location.href = "../Dashboard/dashboard.html";
                        return;
                    }
                } else {
                    await resetDataBase()
                    localStorage.removeItem("token")
                    window.location.href = "../Home/index.html"
                }
            }
        }
    } else {
        localStorage.removeItem("token")
        window.location.href = "../Home/index.html"
    }

    await sleep(400)
    if (localStorage.getItem("firstsign") != "true") {
        await dataErrorHandling()
    }
}

init()