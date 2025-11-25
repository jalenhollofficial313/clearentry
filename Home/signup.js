document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".auth-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const termsCheckbox = form.querySelector('input[name="terms"]');
    const continuebutton = document.getElementById("continue-button");
    const affiliateInput = document.getElementById("affiliate-code");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop normal form post

    // Clear any previous errors (if you decide to render them in the DOM)
    clearFieldErrors();

    continuebutton.innerHTML = "Loading..."
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const termsAccepted = termsCheckbox.checked;
    const affiliate = affiliateInput.value.trim();

    // --- basic validation ---
    let hasError = false;

    if (!name) {
      showFieldError(nameInput, "Please enter your full name.");
      hasError = true;
    }

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

    if (password !== confirmPassword) {
      showFieldError(confirmPasswordInput, "Passwords do not match.");
      hasError = true;
    }

    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to continue.");
      hasError = true;
    }

    if (hasError) return;


    // --- send to backend API (example) ---
    try {
    // change this to your real endpoint
        const response = await fetch("https://add-account-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                referal: affiliate
            })
        });

        if (!response.ok) {
            // handle server error
            const errorData = await response.json().catch(() => ({}));
            const msg =
            errorData.message || "Something went wrong. Please try again.";
            alert(msg);
            return;
        }

    // success
        const data = await response.text().catch(() => ({}));
        console.log("Signup success:", data);
        if (data == "Invalid Email" || data == "Invalid Credentials") {
            showFieldError(
                passwordInput,
                "Email already in use."
            );
        } else {
            localStorage.setItem("firstsign", true)
            localStorage.setItem("token", data)
            window.location.href = "../Dashboard/dashboard.html"
        }

    } catch (err) {
            console.error("Network error:", err);
            alert("Network error. Please check your connection and try again.");
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
            continuebutton.innerHTML = "Continue"
        }

    }

  function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => el.remove());
    document
      .querySelectorAll(".input-error")
      .forEach((el) => el.classList.remove("input-error"));
  }
});
