const toggle = document.getElementById("mobile-toggle");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}

const showcaseTrack = document.getElementById("showcase-track");
const showcaseCaption = document.getElementById("showcase-caption");

if (showcaseTrack && showcaseCaption) {
  const showcases = [
    {
      src: "Analysis.png",
      alt: "Analysis view",
      caption: "Analysis · Performance Breakdown",
    },
    {
      src: "dashboard.png",
      alt: "Dashboard view",
      caption: "Equity Tracker · Visual Growth",
    },
    {
      src: "TradeLogging.png",
      alt: "Trade logging view",
      caption: "Trade Logging · Execution Review",
    },
  ];

  let activeIndex = 1;
  const slots = {
    prev: showcaseTrack.querySelector('[data-slot="prev"] img'),
    main: showcaseTrack.querySelector('[data-slot="main"] img'),
    next: showcaseTrack.querySelector('[data-slot="next"] img'),
  };

  const renderShowcase = () => {
    const prevIndex = (activeIndex - 1 + showcases.length) % showcases.length;
    const nextIndex = (activeIndex + 1) % showcases.length;

    if (slots.prev) {
      slots.prev.src = showcases[prevIndex].src;
      slots.prev.alt = showcases[prevIndex].alt;
    }
    if (slots.main) {
      slots.main.src = showcases[activeIndex].src;
      slots.main.alt = showcases[activeIndex].alt;
    }
    if (slots.next) {
      slots.next.src = showcases[nextIndex].src;
      slots.next.alt = showcases[nextIndex].alt;
    }

    showcaseCaption.textContent = showcases[activeIndex].caption;
  };

  const shiftShowcase = (direction) => {
    if (direction === "next") {
      activeIndex = (activeIndex + 1) % showcases.length;
    } else {
      activeIndex = (activeIndex - 1 + showcases.length) % showcases.length;
    }
    renderShowcase();
  };

  showcaseTrack.querySelectorAll(".showcase-arrow").forEach((button) => {
    button.addEventListener("click", () => {
      const dir = button.getAttribute("data-dir") || "next";
      shiftShowcase(dir);
    });
  });

  renderShowcase();
}

const START_TRIAL_SIGNUP_URL = "signup.html";
const DASHBOARD_URL = "../DashboardRewrite/dashboard.html";
const CHECKOUT_ENDPOINT =
  "https://create-checkout-session-b52ovbio5q-uc.a.run.app";

const initFirebase = () => {
  if (!window.firebase || !window.CLEARENTRY_FIREBASE_CONFIG) {
    return null;
  }
  if (!firebase.apps?.length) {
    firebase.initializeApp(window.CLEARENTRY_FIREBASE_CONFIG);
  }
  return firebase;
};

const waitForAuthUser = () =>
  new Promise((resolve) => {
    const fb = initFirebase();
    if (!fb) {
      resolve(null);
      return;
    }
    fb.auth().onAuthStateChanged((user) => resolve(user));
  });

const sanitizeEmailKey = (email) => (email ? email.replace(/\./g, ",") : "");

const fetchAccountData = async (user) => {
  if (!user) return null;
  const fb = initFirebase();
  if (!fb) return null;
  const db = fb.database();
  const uidPath = `accountsByUid/${user.uid}`;
  let snapshot = await db.ref(uidPath).once("value");
  if (!snapshot.exists() && user.email) {
    const emailPath = `accounts/${sanitizeEmailKey(user.email)}`;
    snapshot = await db.ref(emailPath).once("value");
  }
  return snapshot.exists() ? snapshot.val() : null;
};

const startStripeCheckout = async (button, plan, user) => {
  const originalText = button?.textContent || "";
  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Starting...";
    }
    const token = await user.getIdToken();
    if (!token) {
      window.location.href = START_TRIAL_SIGNUP_URL;
      return;
    }
    const response = await fetch(CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, plan }),
    });
    const checkoutUrl = await response.text();
    const isValidUrl =
      typeof checkoutUrl === "string" && checkoutUrl.startsWith("https://");
    if (response.ok && isValidUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    alert("Unable to start checkout. Please try again.");
  } catch (error) {
    alert("Unable to start checkout. Please try again.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
};

const startTrialButtons = document.querySelectorAll("[data-start-trial='true']");
startTrialButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const plan = button.dataset.plan || "monthly";
    const user = await waitForAuthUser();
    if (!user) {
      window.location.href = START_TRIAL_SIGNUP_URL;
      return;
    }
    const account = await fetchAccountData(user);
    if (account?.stripe_subscription_id) {
      window.location.href = DASHBOARD_URL;
      return;
    }
    await startStripeCheckout(button, plan, user);
  });
});
