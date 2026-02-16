document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".auth-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const continuebutton = document.getElementById("continue-button");
    const FUNNEL_TRACK_ENDPOINT = "https://track-funnel-event-b52ovbio5q-uc.a.run.app";
    const FIREBASE_AUTH_LOGIN_ENDPOINT = "https://firebase-auth-login-b52ovbio5q-uc.a.run.app";
    const notify = (message, type = "error") => {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.warn(message);
        }
    };

    const ensureBackendAccount = async (user) => {
        if (!user) {
            return false;
        }
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(FIREBASE_AUTH_LOGIN_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ idToken })
            });
            const payload = await response.text();
            if (!response.ok || !payload || /missing|invalid|error/i.test(payload)) {
                throw new Error(payload || "Failed to create account.");
            }
            return true;
        } catch (error) {
            console.error("Failed to create account:", error);
            notify("Google sign-in failed. Please try again.", "error");
            try {
                await firebase.auth().signOut();
            } catch (signOutError) {
                console.warn("Failed to sign out after error:", signOutError);
            }
            return false;
        }
    };

    async function trackFunnelEvent(event, source) {
        try {
            await fetch(FUNNEL_TRACK_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    event: event || "unknown",
                    source: source || "signup_form",
                    page: "signup"
                })
            });
        } catch (error) {
            console.warn("Funnel tracking failed:", error);
        }
    }

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop normal form post

    // Clear any previous errors (if you decide to render them in the DOM)
    clearFieldErrors();

    continuebutton.innerHTML = "Loading..."
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = email ? email.split("@")[0].replace(/[._-]+/g, " ") : "";

    // --- basic validation ---
    let hasError = false;

    if (!email || !isValidEmail(email)) {
      showFieldError(emailInput, "Please enter a valid email address.");
      hasError = true;
    }

    if (!password || password.length < 6) {
      showFieldError(
        passwordInput,
        "Password must be at least 6 characters long."
      );
      hasError = true;
    }

    if (hasError) return;


    try {
        if (!window.firebase || !firebase.auth) {
            notify("Signup is not available right now. Please try again.", "error");
            return;
        }

        const userCredential = await firebase
            .auth()
            .createUserWithEmailAndPassword(email, password);

        const response = await fetch(
            "https://add-account-b52ovbio5q-uc.a.run.app",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                })
            }
        );

        if (!response.ok) {
            await userCredential.user.delete();
            const errorData = await response.json().catch(() => ({}));
            const msg =
                errorData.message || "Something went wrong. Please try again.";
            notify(msg, "error");
            return;
        }

        const data = await response.text().catch(() => ({}));
        console.log("Signup success:", data);
        if (data == "Invalid Email" || data == "Invalid Credentials") {
            await userCredential.user.delete();
            showFieldError(passwordInput, "Email already in use.");
        } else {
            trackFunnelEvent("signup_completed", "email_password");
            window.location.href = "../DashboardRewrite/dashboard.html";
        }

    } catch (err) {
        console.error("Network error:", err);
        notify("Network error. Please check your connection and try again.", "error");
    }
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isValidEmail(email) {
        // simple email pattern; you can make this stricter if needed
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    async function removeEL(element) {
        element.remove()
    }

    // optional: render small error messages below inputs
    async function showFieldError(inputEl, message) {
        // add a class for styling if you want


        let errorEl = inputEl.parentElement.querySelector(".field-error");
        if (!errorEl) {
            errorEl = document.createElement("p");
            errorEl.classList.add("input-error");
            errorEl.classList.add("inter-text");
            errorEl.textContent = message;
            inputEl.parentElement.appendChild(errorEl);
            await sleep(1000)
            await removeEL(errorEl)
            continuebutton.innerHTML = "Create Account"
        }

    }

  function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => el.remove());
    document
      .querySelectorAll(".input-error")
      .forEach((el) => el.classList.remove("input-error"));
  }

  const googleButton = document.getElementById("google-signin-button");

  function hideGoogleAuth() {
    const oauthWrapper = googleButton?.closest(".auth-oauth");
    if (oauthWrapper) {
      oauthWrapper.style.display = "none";
    }
  }

  async function handleGoogleSignin() {
    try {
      if (!window.firebase || !firebase.auth) {
        notify("Google sign-in is not available. Please try again.", "error");
        return;
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const accountReady = await ensureBackendAccount(result?.user);
      if (!accountReady) {
          return;
      }
      trackFunnelEvent("signup_completed", "google");
      window.location.href = "../DashboardRewrite/dashboard.html";
    } catch (error) {
      console.error("Google sign-in error:", error);
      notify("Google sign-in failed. Please try again.", "error");
    }
  }

  function initializeGoogleAuth() {
    if (!googleButton) {
      return;
    }

    const firebaseConfig = window.CLEARENTRY_FIREBASE_CONFIG;
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      hideGoogleAuth();
      return;
    }

    if (!firebase.apps?.length) {
      firebase.initializeApp(firebaseConfig);
    }

    googleButton.addEventListener("click", handleGoogleSignin);
  }

  initializeGoogleAuth();
});
