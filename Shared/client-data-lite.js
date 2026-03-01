var clientData = window.clientData || null;
const LEGACY_TOKEN_KEY = "token";
const LOGIN_REDIRECT = "/HomeRewrite/login.html";
const ONBOARDING_PATH = "/PreTradeRewrite/pretrade.html";
const DEMO_TRADES = [
    { id: "demo-1", symbol: "AAPL", direction: "Long", type: "Stocks", strategy: ["Opening Range Breakout"], emotion: "Confident", EntryPrice: 186.45, EntryExit: 189.92, RR: "2.3", PL: 347, date: Math.floor(Date.now() / 1000) - 86400 * 2, trade_notes: "Held through first pullback and respected stop plan.", ruleComplianceStatus: "rule-following" },
    { id: "demo-2", symbol: "TSLA", direction: "Short", type: "Stocks", strategy: ["VWAP Rejection"], emotion: "Impatient", EntryPrice: 227.8, EntryExit: 231.1, RR: "0.7", PL: -330, date: Math.floor(Date.now() / 1000) - 86400 * 3, trade_notes: "Entered early before confirmation candle.", ruleComplianceStatus: "rule-breaking" },
    { id: "demo-3", symbol: "NVDA", direction: "Long", type: "Stocks", strategy: ["Break & Retest"], emotion: "Focused", EntryPrice: 891.2, EntryExit: 899.6, RR: "2.1", PL: 840, date: Math.floor(Date.now() / 1000) - 86400 * 4, trade_notes: "Retest held and volume expanded into close.", ruleComplianceStatus: "rule-following" },
    { id: "demo-4", symbol: "MSFT", direction: "Long", type: "Stocks", strategy: ["Trend Continuation"], emotion: "Calm", EntryPrice: 412.5, EntryExit: 414.1, RR: "1.1", PL: 160, date: Math.floor(Date.now() / 1000) - 86400 * 5, trade_notes: "Small size continuation scalp in lunch session.", ruleComplianceStatus: "rule-following" },
    { id: "demo-5", symbol: "AMD", direction: "Short", type: "Stocks", strategy: ["Failed Breakout"], emotion: "Frustrated", EntryPrice: 167.3, EntryExit: 169.1, RR: "0.8", PL: -180, date: Math.floor(Date.now() / 1000) - 86400 * 6, trade_notes: "Late entry after first impulse already moved.", ruleComplianceStatus: "rule-breaking" },
    { id: "demo-6", symbol: "SPY", direction: "Long", type: "Options", strategy: ["Opening Drive"], emotion: "Disciplined", EntryPrice: 2.35, EntryExit: 3.18, RR: "2.8", PL: 415, date: Math.floor(Date.now() / 1000) - 86400 * 7, trade_notes: "Bought 0DTE call on reclaim of premarket high.", ruleComplianceStatus: "rule-following" },
    { id: "demo-7", symbol: "META", direction: "Short", type: "Options", strategy: ["VWAP Fade"], emotion: "Anxious", EntryPrice: 4.6, EntryExit: 4.1, RR: "1.4", PL: 250, date: Math.floor(Date.now() / 1000) - 86400 * 8, trade_notes: "Quick scalp on rejection at prior day high.", ruleComplianceStatus: "rule-following" },
    { id: "demo-8", symbol: "AMZN", direction: "Long", type: "Stocks", strategy: ["Higher Low Continuation"], emotion: "Patient", EntryPrice: 176.9, EntryExit: 178.2, RR: "1.5", PL: 130, date: Math.floor(Date.now() / 1000) - 86400 * 9, trade_notes: "Waited for second entry after first fake move.", ruleComplianceStatus: "rule-following" },
    { id: "demo-9", symbol: "QQQ", direction: "Long", type: "Futures", strategy: ["Trend Day Pullback"], emotion: "Confident", EntryPrice: 18672, EntryExit: 18718, RR: "2.0", PL: 460, date: Math.floor(Date.now() / 1000) - 86400 * 10, trade_notes: "NQ pullback into 9 EMA with continuation.", ruleComplianceStatus: "rule-following" },
    { id: "demo-10", symbol: "NFLX", direction: "Short", type: "Stocks", strategy: ["Gap Fill Reversal"], emotion: "Neutral", EntryPrice: 612.4, EntryExit: 611.8, RR: "1.0", PL: 60, date: Math.floor(Date.now() / 1000) - 86400 * 11, trade_notes: "Partial into first target, stopped rest at BE.", ruleComplianceStatus: "rule-following" },
    { id: "demo-11", symbol: "EURUSD", direction: "Long", type: "Forex", strategy: ["London Breakout"], emotion: "Focused", EntryPrice: 1.0831, EntryExit: 1.0862, RR: "2.4", PL: 310, date: Math.floor(Date.now() / 1000) - 86400 * 12, trade_notes: "Session high breakout after tight consolidation.", ruleComplianceStatus: "rule-following" },
    { id: "demo-12", symbol: "GBPUSD", direction: "Short", type: "Forex", strategy: ["NY Reversal"], emotion: "Tilted", EntryPrice: 1.2716, EntryExit: 1.2742, RR: "0.6", PL: -260, date: Math.floor(Date.now() / 1000) - 86400 * 13, trade_notes: "Forced setup after two losses; revenge tendency.", ruleComplianceStatus: "rule-breaking" },
    { id: "demo-13", symbol: "BTCUSD", direction: "Long", type: "Crypto", strategy: ["Range Breakout"], emotion: "Motivated", EntryPrice: 61840, EntryExit: 62490, RR: "1.9", PL: 650, date: Math.floor(Date.now() / 1000) - 86400 * 14, trade_notes: "Breakout from overnight balance with volume.", ruleComplianceStatus: "rule-following" },
    { id: "demo-14", symbol: "ETHUSD", direction: "Short", type: "Crypto", strategy: ["Failed Retest"], emotion: "Regretful", EntryPrice: 3412, EntryExit: 3448, RR: "0.5", PL: -360, date: Math.floor(Date.now() / 1000) - 86400 * 15, trade_notes: "Ignored invalidation level; held too long.", ruleComplianceStatus: "rule-breaking" },
    { id: "demo-15", symbol: "ES", direction: "Short", type: "Futures", strategy: ["Opening Reversal"], emotion: "Disciplined", EntryPrice: 5388.25, EntryExit: 5379.5, RR: "2.2", PL: 437, date: Math.floor(Date.now() / 1000) - 86400 * 16, trade_notes: "Rejected opening drive into prior day value area.", ruleComplianceStatus: "rule-following" },
    { id: "demo-16", symbol: "CL", direction: "Long", type: "Futures", strategy: ["Support Bounce"], emotion: "Cautious", EntryPrice: 77.4, EntryExit: 78.05, RR: "1.6", PL: 325, date: Math.floor(Date.now() / 1000) - 86400 * 17, trade_notes: "Crude bounced at weekly support and held VWAP.", ruleComplianceStatus: "rule-following" },
    { id: "demo-17", symbol: "XAUUSD", direction: "Short", type: "Forex", strategy: ["Mean Reversion"], emotion: "Neutral", EntryPrice: 2418.6, EntryExit: 2413.9, RR: "1.8", PL: 470, date: Math.floor(Date.now() / 1000) - 86400 * 18, trade_notes: "Gold rejected upper Bollinger with divergence.", ruleComplianceStatus: "rule-following" },
    { id: "demo-18", symbol: "NQ", direction: "Long", type: "Futures", strategy: ["Afternoon Trend"], emotion: "Confident", EntryPrice: 18620, EntryExit: 18695, RR: "2.7", PL: 750, date: Math.floor(Date.now() / 1000) - 86400 * 19, trade_notes: "Continuation after FOMC drift breakout.", ruleComplianceStatus: "rule-following" },
];

const hasPaidAccess = (account) =>
    Boolean(account?.stripe_subscription_id) ||
    Boolean(account?.foundingMemberAccess);

const hasAtLeastOneStrategy = (account) =>
    Object.keys(account?.strategies || {}).length > 0;

const requiresStrategyOnboarding = (account) =>
    Boolean(account?.isFirstTimeUser) || !hasAtLeastOneStrategy(account);

const shouldEnableDemoMode = (account) => !hasPaidAccess(account);

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
        body.demo-mode .demo-readonly,
        body.demo-mode [data-demo-locked="true"] {
            cursor: not-allowed !important;
        }
        body.demo-mode button.demo-readonly:disabled,
        body.demo-mode input.demo-readonly:disabled,
        body.demo-mode select.demo-readonly:disabled,
        body.demo-mode textarea.demo-readonly:disabled {
            opacity: 0.6;
        }
    `;
    document.head.appendChild(style);
};

const startTrialCheckout = async (button) => {
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
                body: JSON.stringify({
                    token,
                    offer: "founding_member_beta"
                }),
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
    window.CE_TRIAL_ACTIVE = false;
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
                <span>Sample data only. Claim founding member access to unlock your own insights.</span>
            </div>
        `;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Claim founding access";
        button.dataset.demoAllow = "true";
        button.addEventListener("click", () => startTrialCheckout(button));
        banner.appendChild(button);
        document.body.prepend(banner);

        const fab = document.createElement("button");
        fab.type = "button";
        fab.className = "demo-fab";
        fab.textContent = "Claim founding access to unlock your own insights";
        fab.dataset.demoAllow = "true";
        fab.addEventListener("click", () => startTrialCheckout(fab));
        document.body.appendChild(fab);

        // Lock interactive controls in demo mode so users can view but not modify data.
        const isAllowedControl = (node) => {
            if (!node) return false;
            if (node.dataset?.demoAllow === "true") return true;
            if (node.id === "theme-toggle" || node.id === "logout-button") return true;
            if (
                node.id === "post-signup-next" ||
                node.id === "post-signup-finish" ||
                node.id === "post-signup-skip" ||
                node.id === "subscription-gate-close" ||
                node.id === "trade-limit-paywall-close"
            ) {
                return true;
            }
            if (typeof node.closest === "function" && node.closest("#post-signup-walkthrough")) {
                return true;
            }
            if (node.classList?.contains("subscription-gate-close")) return true;
            if (node.classList?.contains("subscription-lock-close")) return true;
            if (node.classList?.contains("mobile-nav-toggle")) return true;
            if (node.classList?.contains("nav-item-parent")) return true;
            return false;
        };

        const lockControls = () => {
            if (window.CE_DEMO_CONTROLS_LOCKED) return;
            window.CE_DEMO_CONTROLS_LOCKED = true;
            const applyLockToControls = (root = document) => {
                const controls = root.querySelectorAll
                    ? root.querySelectorAll("input, select, textarea, button")
                    : [];
                controls.forEach((node) => {
                    if (isAllowedControl(node)) return;
                    node.classList.add("demo-readonly");
                    node.setAttribute("data-demo-locked", "true");
                    if ("disabled" in node) node.disabled = true;
                    if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
                        node.readOnly = true;
                    }
                });
            };

            applyLockToControls(document);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (!(node instanceof Element)) return;
                        if (node.matches?.("input, select, textarea, button")) {
                            if (!isAllowedControl(node)) {
                                node.classList.add("demo-readonly");
                                node.setAttribute("data-demo-locked", "true");
                                if ("disabled" in node) node.disabled = true;
                                if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
                                    node.readOnly = true;
                                }
                            }
                        }
                        applyLockToControls(node);
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });

            document.addEventListener(
                "click",
                (event) => {
                    if (!window.CE_DEMO_MODE) return;
                    const target = event.target?.closest?.("a, button, [role='button']");
                    if (!target) return;
                    if (isAllowedControl(target)) return;
                    if (target.tagName === "A") {
                        const href = (target.getAttribute("href") || "").trim();
                        // Allow normal navigation links so users can still explore pages.
                        if (href && href !== "#" && !href.toLowerCase().startsWith("javascript:")) {
                            return;
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    if (window.showNotification) {
                        window.showNotification(
                            "Demo mode is read-only. Claim founding access to unlock real actions.",
                            "warning"
                        );
                    }
                },
                true
            );
        };

        /*
         * Keep existing behavior: lock immediate controls and all future controls
         * created by page scripts after initial load.
         */
        lockControls();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ready);
    } else {
        ready();
    }
};

const enforceOnboardingRedirect = (account) => {
    const currentPath = (window.location.pathname || "").toLowerCase();
    const onOnboardingPage = currentPath.includes("/pretraderewrite/pretrade.html");
    const shouldRedirect =
        hasPaidAccess(account) &&
        requiresStrategyOnboarding(account) &&
        !onOnboardingPage;

    if (!shouldRedirect) {
        return false;
    }

    window.location.href = `${ONBOARDING_PATH}?onboarding=1`;
    return true;
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
    if (!window.location.pathname.toLowerCase().includes("login.html")) {
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
    enforceOnboardingRedirect(account);
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
