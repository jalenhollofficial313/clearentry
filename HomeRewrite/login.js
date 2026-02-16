document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".auth-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const continuebutton = document.getElementById("continue-button");
    const LEGACY_LOGIN_CHECK_ENDPOINT = "https://legacy-login-check-b52ovbio5q-uc.a.run.app";
    const FIREBASE_AUTH_LOGIN_ENDPOINT = "https://firebase-auth-login-b52ovbio5q-uc.a.run.app";
    const DASHBOARD_REDIRECT = "../DashboardRewrite/dashboard.html";
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

    const ensureFirebase = () => {
        const config = window.CLEARENTRY_FIREBASE_CONFIG;
        if (!window.firebase || !config?.apiKey) {
            return null;
        }
        if (!firebase.apps?.length) {
            firebase.initializeApp(config);
        }
        return firebase;
    };

    const redirectIfSignedIn = () => {
        const fb = ensureFirebase();
        if (!fb?.auth) {
            return;
        }
        fb.auth().onAuthStateChanged((user) => {
            if (user) {
                window.location.href = DASHBOARD_REDIRECT;
            }
        });
    };

    redirectIfSignedIn();

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop normal form post

    // Clear any previous errors (if you decide to render them in the DOM)
    clearFieldErrors();

    continuebutton.innerHTML = "Loading..."
    const email = emailInput.value.trim();
    const password = passwordInput.value;

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

    if (hasError) {
      continuebutton.innerHTML = "Continue";
      return;
    }


    try {
        if (!window.firebase || !firebase.auth) {
            notify("Login is not available right now. Please try again.", "error");
            continuebutton.innerHTML = "Continue";
            return;
        }

        await firebase.auth().signInWithEmailAndPassword(email, password);
        localStorage.setItem("firstsign", true);
        window.location.href = DASHBOARD_REDIRECT;
    } catch (err) {
        console.error("Login error:", err);
        const code = err?.code || "";
        const hasFirebaseAccount = await hasFirebaseAuthAccount(email);
        if (hasFirebaseAccount) {
            showFieldError(passwordInput, "Incorrect password.");
            continuebutton.innerHTML = "Continue";
            return;
        }

        const legacyHandled = await attemptLegacyLoginCheck(email, password);
        if (legacyHandled) {
            continuebutton.innerHTML = "Continue";
            return;
        }

        if (code.includes("user-not-found")) {
            showFieldError(emailInput, "No account found for this email.");
        } else if (code.includes("wrong-password")) {
            showFieldError(passwordInput, "Incorrect password.");
        } else {
            notify("Login failed. Please try again.", "error");
        }
        continuebutton.innerHTML = "Continue";
    }
    });

    async function hasFirebaseAuthAccount(email) {
        try {
            const fb = ensureFirebase();
            if (!fb?.auth || !email) {
                return false;
            }
            const methods = await fb.auth().fetchSignInMethodsForEmail(email);
            return Array.isArray(methods) && methods.length > 0;
        } catch (error) {
            console.warn("Failed to check Firebase auth methods:", error);
            return false;
        }
    }

    async function attemptLegacyLoginCheck(email, password) {
        try {
            const response = await fetch(LEGACY_LOGIN_CHECK_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json().catch(() => ({}));
            if (result?.ok) {
                notify("Legacy account found. Check your email to reset your password.", "success");
                return true;
            }
        } catch (error) {
            console.error("Legacy login check error:", error);
        }

        return false;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isValidEmail(email) {
        // simple email pattern; you can make this stricter if needed
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof openPasswordResetModal === 'function') {
                openPasswordResetModal('');
            }
        });
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
            continuebutton.innerHTML = "Continue"
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
      localStorage.setItem("firstsign", true);
      window.location.href = DASHBOARD_REDIRECT;
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
