var clientData = window.clientData || null;
const LEGACY_TOKEN_KEY = "token";
const LOGIN_REDIRECT = "../HomeRewrite/login.html";
const TRIAL_TRADE_LIMIT = 5;
const DEMO_TRADES = [
    { id: "demo-1", symbol: "AAPL", direction: "Long", PL: 420, date: Math.floor(Date.now() / 1000) - 86400 * 2 },
    { id: "demo-2", symbol: "TSLA", direction: "Short", PL: -180, date: Math.floor(Date.now() / 1000) - 86400 * 3 },
    { id: "demo-3", symbol: "NVDA", direction: "Long", PL: 260, date: Math.floor(Date.now() / 1000) - 86400 * 4 },
    { id: "demo-4", symbol: "MSFT", direction: "Long", PL: 90, date: Math.floor(Date.now() / 1000) - 86400 * 5 },
    { id: "demo-5", symbol: "AMD", direction: "Short", PL: -120, date: Math.floor(Date.now() / 1000) - 86400 * 6 },
    { id: "demo-6", symbol: "SPY", direction: "Long", PL: 310, date: Math.floor(Date.now() / 1000) - 86400 * 7 },
    { id: "demo-7", symbol: "META", direction: "Short", PL: -60, date: Math.floor(Date.now() / 1000) - 86400 * 8 },
    { id: "demo-8", symbol: "AMZN", direction: "Long", PL: 150, date: Math.floor(Date.now() / 1000) - 86400 * 9 },
    { id: "demo-9", symbol: "QQQ", direction: "Long", PL: 210, date: Math.floor(Date.now() / 1000) - 86400 * 10 },
    { id: "demo-10", symbol: "NFLX", direction: "Short", PL: -40, date: Math.floor(Date.now() / 1000) - 86400 * 11 },
];

const hasActiveSubscription = (account) =>
    Boolean(account?.stripe_subscription_id);

const getTrialDaysLeft = (account) => {
    if (account?.trialActive === false) return 0;
    const trialStartedAt = account?.trialStartedAt;
    if (!trialStartedAt) return null;
    return account?.trialActive ? null : 0;
};

const isTrialActive = (account) => {
    if (account?.trialActive !== undefined) {
        return Boolean(account.trialActive);
    }
    if (!account?.trialStartedAt) return false;
    const tradeCount = Number(account?.trialTradeCount || 0);
    if (tradeCount >= TRIAL_TRADE_LIMIT) return false;
    return true;
};

const shouldEnableDemoMode = (account) =>
    !hasActiveSubscription(account) && !isTrialActive(account);

const buildDemoAccount = (account) => {
    const demoTrades = DEMO_TRADES.reduce((acc, trade) => {
        acc[trade.id] = trade;
        return acc;
    }, {});
    return {
        ...account,
        name: "Demo Trader",
        membership: "Standard",
        trades: demoTrades,
        analysis: {
            demo: true,
            headline: "Example insights",
            highlights: [
                "Rule breaks spike after two consecutive losses.",
                "Best returns come from A+ setups with full checklist compliance.",
                "Overtrading appears in the last hour of your session.",
            ],
        },
        demoData: true,
    };
};

const injectDemoStyles = () => {
    if (document.getElementById("demo-mode-styles")) return;
    const style = document.createElement("style");
    style.id = "demo-mode-styles";
    style.textContent = `
        .demo-banner {
            position: sticky;
            top: 0;
            z-index: 999;
            background: rgba(14, 14, 14, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            color: #f5f5f5;
            font-family: "Inter", sans-serif;
        }
        .demo-banner strong {
            color: #ffffff;
        }
        .demo-banner span {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        .demo-banner button {
            background: #ffffff;
            color: #0a0a0a;
            border: none;
            border-radius: 999px;
            padding: 10px 18px;
            font-weight: 600;
            cursor: pointer;
        }
        .demo-banner button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .demo-fab {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 999;
            background: #ffffff;
            color: #0a0a0a;
            border: none;
            border-radius: 999px;
            padding: 12px 20px;
            font-weight: 600;
            box-shadow: 0 18px 30px rgba(0, 0, 0, 0.35);
            cursor: pointer;
        }
        .demo-fab:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        body.demo-mode .demo-readonly {
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);
};

const startTrialCheckout = async (button, plan = "monthly") => {
    const originalText = button?.textContent || "";
    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Starting...";
        }
        const token = await getAuthToken();
        if (!token) {
            window.location.href = LOGIN_REDIRECT;
            return;
        }
        const response = await fetch(
            "https://create-checkout-session-b52ovbio5q-uc.a.run.app",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, plan }),
            }
        );
        const checkoutUrl = await response.text();
        const isValidUrl =
            typeof checkoutUrl === "string" &&
            checkoutUrl.startsWith("https://");
        if (response.ok && isValidUrl) {
            sessionStorage.setItem("pendingProCheckout", "true");
            window.location.href = checkoutUrl;
            return;
        }
        if (window.showNotification) {
            window.showNotification("Unable to start checkout.", "error");
        } else {
            alert("Unable to start checkout.");
        }
    } catch (error) {
        if (window.showNotification) {
            window.showNotification("Unable to start checkout.", "error");
        } else {
            alert("Unable to start checkout.");
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
};

const applyDemoGate = (account) => {
    const enableDemo = shouldEnableDemoMode(account);
    window.CE_DEMO_MODE = enableDemo;
    window.CE_TRIAL_ACTIVE = isTrialActive(account);
    if (!enableDemo || window.CE_DEMO_GATE_READY) return;
    const ready = () => {
        if (window.CE_DEMO_GATE_READY) return;
        window.CE_DEMO_GATE_READY = true;
        document.body.classList.add("demo-mode");
        injectDemoStyles();

        const banner = document.createElement("div");
        banner.className = "demo-banner";
        banner.innerHTML = `
            <div>
                <strong>Demo mode</strong>
                <span>Sample data only. Start your subscription to unlock your own insights.</span>
            </div>
        `;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Start subscription";
        button.dataset.demoAllow = "true";
        button.addEventListener("click", () => startTrialCheckout(button));
        banner.appendChild(button);
        document.body.prepend(banner);

        const fab = document.createElement("button");
        fab.type = "button";
        fab.className = "demo-fab";
        fab.textContent = "Start subscription to unlock your own insights";
        fab.dataset.demoAllow = "true";
        fab.addEventListener("click", () => startTrialCheckout(fab));
        document.body.appendChild(fab);

        const scope = document.querySelector(".main") || document.body;
        scope.querySelectorAll("input, textarea, select, button").forEach((el) => {
            if (el.closest(".demo-banner")) return;
            if (el.dataset.demoAllow === "true") return;
            el.disabled = true;
            el.classList.add("demo-readonly");
        });
        scope.querySelectorAll("form").forEach((form) => {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                if (window.showNotification) {
                    window.showNotification(
                        "Demo mode is read-only. Start a subscription to unlock edits.",
                        "error"
                    );
                }
            });
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ready);
    } else {
        ready();
    }
};

const setClientData = (account) => {
    if (!account) return;
    clientData = { result: account };
    window.clientData = clientData;
};

const initFirebase = () => {
    const config = window.CLEARENTRY_FIREBASE_CONFIG;
    if (!window.firebase || !config) {
        console.error("Firebase SDK or config missing.");
        return null;
    }
    if (!firebase.apps?.length) {
        firebase.initializeApp(config);
    }
    return firebase;
};

const enforceLegacyTokenLogout = async () => {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (!legacyToken) return false;
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    try {
        const fb = initFirebase();
        if (fb?.auth) {
            await fb.auth().signOut();
        }
    } catch (error) {
        console.warn("Failed to sign out legacy session", error);
    }
    if (!window.location.pathname.includes("/HomeRewrite/login.html")) {
        window.location.href = LOGIN_REDIRECT;
    }
    return true;
};

const waitForAuthUser = () =>
    new Promise((resolve) => {
        enforceLegacyTokenLogout().then((didLogout) => {
            if (didLogout) {
                resolve(null);
                return;
            }
        });
        const fb = initFirebase();
        if (!fb) {
            resolve(null);
            return;
        }
        fb.auth().onAuthStateChanged((user) => resolve(user));
    });

const sanitizeEmailKey = (email) =>
    email ? email.replace(/\./g, ",") : "";

const getAccountSnapshot = async (user) => {
    const fb = initFirebase();
    if (!fb || !user) return null;
    const db = fb.database();
    const uidPath = `accountsByUid/${user.uid}`;
    let snapshot = await db.ref(uidPath).once("value");
    if (snapshot.exists()) {
        return snapshot;
    }
    if (user.email) {
        const emailPath = `accounts/${sanitizeEmailKey(user.email)}`;
        snapshot = await db.ref(emailPath).once("value");
        if (snapshot.exists()) {
            return snapshot;
        }
    }
    return null;
};

async function getAuthToken() {
    const user = await waitForAuthUser();
    if (!user) {
        return null;
    }
    const token = await user.getIdToken();
    window.CE_AUTH_TOKEN = token;
    return token;
}

async function getAccountData() {
    const user = await waitForAuthUser();
    if (!user) {
        console.warn("No authenticated user for account data.");
        return null;
    }
    let snapshot = await getAccountSnapshot(user);
    if (!snapshot) {
        console.warn("No account data found for user. Attempting to create it...");
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(
                "https://firebase-auth-login-b52ovbio5q-uc.a.run.app",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ idToken })
                }
            );
            const payload = await response.text();
            if (!response.ok || !payload || /missing|invalid|error/i.test(payload)) {
                console.warn("Backend account creation failed:", payload);
            }
        } catch (error) {
            console.warn("Backend account creation error:", error);
        }
        snapshot = await getAccountSnapshot(user);
        if (!snapshot) {
            console.warn("No account data found for user after retry.");
            return null;
        }
    }
    const account = snapshot.val();
    if (account && !account.uid) {
        account.uid = user.uid;
    }
    const demoEnabled = shouldEnableDemoMode(account);
    const accountToUse = demoEnabled ? buildDemoAccount(account) : account;
    setClientData(accountToUse);
    applyDemoGate(account);
    return accountToUse;
}

async function getClientData() {
    await getAccountData();
    return clientData;
}

async function updateClientData() {
    return getClientData();
}

function dataErrorHandling() {
    return;
}

function resetDataBase() {
    return;
}

window.getClientData = getClientData;
window.updateClientData = updateClientData;
window.dataErrorHandling = dataErrorHandling;
window.resetDataBase = resetDataBase;
window.getAuthToken = getAuthToken;
window.getAuthTokenSync = () => window.CE_AUTH_TOKEN || null;
window.getAccountData = getAccountData;
window.startTrialCheckout = startTrialCheckout;
