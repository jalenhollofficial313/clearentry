loginButton = document.getElementById("login-button");
signupButton = document.getElementById("signup-button");
signupButton2 = document.getElementById("signup-button2");
signoutButton = document.getElementById("signout-button");
dashboardButton = document.getElementById("dashboard-button");
dashboardButton2 = document.getElementById("dashboard-button2");
upgradeButton = document.getElementById("upgrade-button");




signoutButton.addEventListener("click", function(){
    if (localStorage.getItem("token")) {
        localStorage.removeItem("token")
    }

    if (localStorage.getItem("token") != null) {
        console.log("Check")
        loginButton.style.display = "None";
        signupButton.style.display = "None";
        signupButton2.style.display = "None";
        signoutButton.style.display = "unset";
        dashboardButton.style.display = "unset";
        dashboardButton2.style.display = "unset";
    } else {
        loginButton.style.display = "unset";
        signupButton.style.display = "unset";
        signupButton2.style.display = "unset";
        signoutButton.style.display = "None";
        dashboardButton.style.display = "None";
        dashboardButton2.style.display = "None";
    }
})


if (localStorage.getItem("token") != null) {
    console.log("Check")
    loginButton.style.display = "None";
    signupButton.style.display = "None";
    signupButton2.style.display = "None";
    signoutButton.style.display = "unset";
    dashboardButton.style.display = "unset";
    dashboardButton2.style.display = "unset";
} else {
    loginButton.style.display = "unset";
    signupButton.style.display = "unset";
    signupButton2.style.display = "unset";
    signoutButton.style.display = "None";
    dashboardButton.style.display = "None";
    dashboardButton2.style.display = "None";
}

console.log("check2")
// Payment modal handling
const paymentSuccessModal = document.getElementById("payment-success-modal");
const paymentCancelModal = document.getElementById("payment-cancel-modal");
const successCloseButton = document.getElementById("success-close-button");
const cancelCloseButton = document.getElementById("cancel-close-button");

// Check URL parameters for payment status
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
console.log(sessionId)
const isCancel = window.location.pathname.includes('cancel') || urlParams.get('canceled') === 'true';

// Show success modal if session_id is present
if (sessionId) {
    console.log("Payment Successful")
    paymentSuccessModal.classList.add('show');
    // Reinitialize icons for the modal
    setTimeout(() => {
        lucide.createIcons();
    }, 100);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Show cancel modal if on cancel page
if (isCancel) {
    paymentCancelModal.classList.add('show');
    // Reinitialize icons for the modal
    setTimeout(() => {
        lucide.createIcons();
    }, 100);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Close success modal and redirect to dashboard
if (successCloseButton) {
    successCloseButton.addEventListener('click', () => {
        paymentSuccessModal.classList.remove('show');
        if (localStorage.getItem("token")) {
            window.location.href = "../Dashboard/dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    });
}

// Close cancel modal
if (cancelCloseButton) {
    cancelCloseButton.addEventListener('click', () => {
        paymentCancelModal.classList.remove('show');
    });
}

// Close modals when clicking outside
if (paymentSuccessModal) {
    paymentSuccessModal.addEventListener('click', (e) => {
        if (e.target === paymentSuccessModal) {
            paymentSuccessModal.classList.remove('show');
        }
    });
}

if (paymentCancelModal) {
    paymentCancelModal.addEventListener('click', (e) => {
        if (e.target === paymentCancelModal) {
            paymentCancelModal.classList.remove('show');
        }
    });
}

if (upgradeButton) {
    upgradeButton.addEventListener("click", async function() {
        const token = localStorage.getItem("token");
        
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = "login.html";
            return;
        }

        try {
            // Disable button during request
            upgradeButton.disabled = true;
            upgradeButton.textContent = "Processing...";

            const response = await fetch("https://create-checkout-session-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token
                })
            });

            const checkoutUrl = await response.text();

            if (response.ok && checkoutUrl) {
                // Redirect to Stripe checkout
                window.location.href = checkoutUrl;
            } else {
                console.error("Failed to create checkout session:", checkoutUrl);
                alert("Failed to start checkout. Please try again.");
                upgradeButton.disabled = false;
                upgradeButton.textContent = "Upgrade to Pro";
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("An error occurred. Please try again.");
            upgradeButton.disabled = false;
            upgradeButton.textContent = "Upgrade to Pro";
        }
    });
}