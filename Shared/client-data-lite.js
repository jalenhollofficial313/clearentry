var clientData = window.clientData || null;
const LEGACY_TOKEN_KEY = "token";
const LOGIN_REDIRECT = "../Home/login.html";

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
    if (!window.location.pathname.includes("/Home/login.html")) {
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
    const snapshot = await getAccountSnapshot(user);
    if (!snapshot) {
        console.warn("No account data found for user.");
        return null;
    }
    const account = snapshot.val();
    if (account && !account.uid) {
        account.uid = user.uid;
    }
    setClientData(account);
    return account;
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

