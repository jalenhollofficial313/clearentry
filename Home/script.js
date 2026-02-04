loginButton = document.getElementById("login-button");
signupButton = document.getElementById("signup-button");
signupButton2 = document.getElementById("signup-button2");
signoutButton = document.getElementById("signout-button");
dashboardButton = document.getElementById("dashboard-button");
dashboardButton2 = document.getElementById("dashboard-button2");
upgradeButton = document.getElementById("upgrade-button");
window.location.href = "https://clear-entry.com"
const FUNNEL_TRACK_ENDPOINT = "https://track-funnel-event-b52ovbio5q-uc.a.run.app";
const notify = (message, type = "error") => {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.warn(message);
    }
};

async function trackFunnelEvent(event, source, page) {
    try {
        await fetch(FUNNEL_TRACK_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                event: event || "unknown",
                source: source || "unknown",
                page: page || window.location.pathname
            })
        });
    } catch (error) {
        console.warn("Funnel tracking failed:", error);
    }
}




signoutButton.addEventListener("click", async function(){
    const token = localStorage.getItem("token");
    
    // Call backend to delete token
    if (token) {
        try {
            await fetch("https://logout-request-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token
                })
            });
        } catch (error) {
            console.error("Error logging out:", error);
            // Continue with logout even if backend call fails
        }
    }
    
    // Remove token from localStorage
    localStorage.removeItem("token");
    
    // Update UI
    loginButton.style.display = "unset";
    signupButton.style.display = "unset";
    signupButton2.style.display = "unset";
    signoutButton.style.display = "None";
    dashboardButton.style.display = "None";
    dashboardButton2.style.display = "None";
    
    // Redirect to home page
    window.location.href = "index.html";
})

if (signupButton) {
    signupButton.addEventListener("click", () => {
        trackFunnelEvent("signup_click", "header_button", "home");
    });
}

if (signupButton2) {
    signupButton2.addEventListener("click", () => {
        trackFunnelEvent("signup_click", "hero_button", "home");
    });
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

console.log("check2")
// Payment modal handling
const pendingCheckoutKey = "pendingProCheckout";
const paymentSuccessModal = document.getElementById("payment-success-modal");
const paymentCancelModal = document.getElementById("payment-cancel-modal");
const successCloseButton = document.getElementById("success-close-button");
const cancelCloseButton = document.getElementById("cancel-close-button");
const successMessage = paymentSuccessModal?.querySelector(".payment-modal-message");
const defaultSuccessMessage = successMessage ? successMessage.textContent : "";

// Check URL parameters for payment status
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
console.log(sessionId)
const isCancel = window.location.pathname.includes('cancel') || urlParams.get('canceled') === 'true';
const hasPendingCheckout = localStorage.getItem(pendingCheckoutKey) === "true";

// Show success modal if session_id is present
if (sessionId) {
    console.log("Payment Successful")
    localStorage.setItem(pendingCheckoutKey, "true");
    paymentSuccessModal.classList.add('show');
    if (successMessage) {
        successMessage.textContent = "Finalizing your subscription. Please wait...";
    }
    // Reinitialize icons for the modal
    setTimeout(() => {
        lucide.createIcons();
    }, 100);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

if (hasPendingCheckout && !sessionId) {
    paymentSuccessModal.classList.add('show');
    if (successMessage) {
        successMessage.textContent = "Finalizing your subscription. Please wait...";
    }
}

// Show cancel modal if on cancel page
if (isCancel) {
    paymentCancelModal.classList.add('show');
    trackFunnelEvent("checkout_abandoned", "stripe_cancel", "home");
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
        if (localStorage.getItem(pendingCheckoutKey) === "true") {
            return;
        }
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

function setDashboardButtonsPendingState(isPending) {
    const disabledStyle = isPending ? "0.6" : "";
    if (dashboardButton) {
        dashboardButton.style.pointerEvents = isPending ? "none" : "auto";
        dashboardButton.style.opacity = disabledStyle;
    }
    if (dashboardButton2) {
        dashboardButton2.style.pointerEvents = isPending ? "none" : "auto";
        dashboardButton2.style.opacity = disabledStyle;
    }
}

async function fetchAccountData(token) {
    const response = await fetch("https://get-accountdata-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
    });
    const responseText = await response.text();
    if (responseText === "Invalid Token") {
        return null;
    }
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return null;
    }
}

async function waitForProMembership() {
    const token = localStorage.getItem("token");
    if (!token) {
        return false;
    }

    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const data = await fetchAccountData(token);
        const membership = data?.result?.membership?.toLowerCase();
        const subscriptionId = data?.result?.stripe_subscription_id;

        if (membership === "pro" || subscriptionId) {
            localStorage.removeItem(pendingCheckoutKey);
            if (successMessage) {
                successMessage.textContent = defaultSuccessMessage || "Welcome to ClearEntry Pro! Your subscription is now active.";
            }
            if (successCloseButton) {
                successCloseButton.textContent = "Continue to Dashboard";
                successCloseButton.disabled = false;
            }
            setDashboardButtonsPendingState(false);
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
}

if (localStorage.getItem(pendingCheckoutKey) === "true") {
    const token = localStorage.getItem("token");
    if (!token) {
        localStorage.removeItem(pendingCheckoutKey);
        if (paymentSuccessModal) {
            paymentSuccessModal.classList.remove('show');
        }
    } else {
        setDashboardButtonsPendingState(true);
        if (successCloseButton) {
            successCloseButton.disabled = true;
            successCloseButton.textContent = "Finalizing...";
        }
        waitForProMembership().then((synced) => {
            if (!synced) {
                localStorage.removeItem(pendingCheckoutKey);
                if (successMessage) {
                    successMessage.textContent = "We couldn't confirm your subscription yet. You can continue and we'll sync it in the dashboard.";
                }
                if (successCloseButton) {
                    successCloseButton.disabled = false;
                    successCloseButton.textContent = "Continue";
                }
                setDashboardButtonsPendingState(false);
            }
        });
    }
}

// Close modals when clicking outside
if (paymentSuccessModal) {
    paymentSuccessModal.addEventListener('click', (e) => {
        if (e.target === paymentSuccessModal) {
            if (localStorage.getItem(pendingCheckoutKey) === "true") {
                return;
            }
            paymentSuccessModal.classList.remove('show');
        }
    });
}

// Extension notification (show once)
(function() {
    const EXTENSION_NOTICE_KEY = "extensionNoticeDismissed";
    const extensionNotification = document.getElementById("extension-notification");
    const extensionClose = document.getElementById("extension-notification-close");

    if (!extensionNotification) {
        return;
    }

    const isMobile = (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) || window.innerWidth <= 900;
    if (isMobile) {
        extensionNotification.style.display = "none";
        return;
    }

    extensionNotification.style.display = "block";

    if (extensionClose) {
        extensionClose.addEventListener("click", () => {
            if (extensionNotification) {
                extensionNotification.classList.add("hide");
                setTimeout(() => {
                    extensionNotification.style.display = "none";
                    extensionNotification.classList.remove("hide");
                }, 300);
            }
        });
    }
})();

if (paymentCancelModal) {
    paymentCancelModal.addEventListener('click', (e) => {
        if (e.target === paymentCancelModal) {
            paymentCancelModal.classList.remove('show');
        }
    });
}

if (upgradeButton) {
    upgradeButton.addEventListener("click", async function() {
        trackFunnelEvent("signup_click", "pricing_button", "home");
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

            const trialResponse = await fetch("https://start-free-trial-b52ovbio5q-uc.a.run.app", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token
                })
            });

            const trialResult = await trialResponse.text();

            if (trialResponse.ok && trialResult === "Success") {
                window.location.href = "../Dashboard/dashboard.html";
                return;
            }

            if (!trialResponse.ok || trialResult !== "Trial Used") {
                console.error("Failed to start trial:", trialResult);
                notify("Failed to start trial. Please try again.", "error");
                upgradeButton.disabled = false;
                upgradeButton.textContent = "Start Free Trial";
                return;
            }

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
                trackFunnelEvent("checkout_started", "pricing_button", "home");
                // Redirect to Stripe checkout
                window.location.href = checkoutUrl;
            } else {
                console.error("Failed to create checkout session:", checkoutUrl);
                notify("Failed to start checkout. Please try again.", "error");
                upgradeButton.disabled = false;
                upgradeButton.textContent = "Start Free Trial";
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            notify("An error occurred. Please try again.", "error");
            upgradeButton.disabled = false;
            upgradeButton.textContent = "Start Free Trial";
        }
    });
}

// Quick Tour Modal Functionality
(function() {
    const ENTRY_MODAL_KEY = 'quickTourEntryShown';
    const TOUR_COMPLETE_KEY = 'quickTourCompleted';
    const DEMO_TRACK_ENDPOINT = 'https://track-demo-use-b52ovbio5q-uc.a.run.app';
    
    const entryModal = document.getElementById('quick-tour-entry-modal');
    const walkthroughModal = document.getElementById('quick-tour-walkthrough');
    const yesButton = document.getElementById('quick-tour-yes');
    const noButton = document.getElementById('quick-tour-no');
    const closeButton = document.getElementById('quick-tour-close');
    const continueButton = document.getElementById('quick-tour-continue');
    const prevButton = document.getElementById('quick-tour-prev');
    const nextButton = document.getElementById('quick-tour-next');
    const progressDots = document.querySelectorAll('.quick-tour-progress-dot');
    const slides = document.querySelectorAll('.quick-tour-slide');
    const emailForm = document.getElementById('quick-tour-email-form');
    const emailInput = document.getElementById('quick-tour-email-input');
    const emailMessage = document.getElementById('quick-tour-email-message');
    
    let currentSlide = 1;
    const totalSlides = 7;
    
    // Check if modal should be shown (first visit only)
    function shouldShowEntryModal() {
        // Don't show if already shown in this session
        if (sessionStorage.getItem(ENTRY_MODAL_KEY)) {
            return false;
        }
        // Don't show if tour was already completed
        if (sessionStorage.getItem(TOUR_COMPLETE_KEY)) {
            return false;
        }

        if (localStorage.getItem("token") != "" && localStorage.getItem("token") != null) {
            return false;
        }
        return true;
    }
    
    // Show entry modal after delay
    function showEntryModal() {
        if (shouldShowEntryModal()) {
            const delay = 5000; // 30-60 seconds
            setTimeout(() => {
                if (shouldShowEntryModal()) {
                    entryModal.classList.add('show');
                    lucide.createIcons();
                }
            }, delay);
        }
    }
    
    async function trackDemoUse(source) {
        try {
            await fetch(DEMO_TRACK_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: source || 'unknown'
                })
            });
        } catch (error) {
            console.warn('Demo tracking failed:', error);
        }
    }

    // Show walkthrough modal
    function showWalkthrough() {
        entryModal.classList.remove('show');
        walkthroughModal.classList.add('show');
        sessionStorage.setItem(ENTRY_MODAL_KEY, 'true');
        currentSlide = 1;
        updateSlide();
        lucide.createIcons();
    }

    window.openDemoFromSource = (source) => {
        trackDemoUse(source);
        showWalkthrough();
    };
    
    // Close entry modal
    function closeEntryModal() {
        entryModal.classList.remove('show');
        sessionStorage.setItem(ENTRY_MODAL_KEY, 'true');
    }
    
    // Close walkthrough modal
    function closeWalkthrough() {
        walkthroughModal.classList.remove('show');
        sessionStorage.setItem(TOUR_COMPLETE_KEY, 'true');
    }
    
    // Update slide display
    function updateSlide() {
        slides.forEach((slide, index) => {
            if (index + 1 === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        // Update progress dots
        progressDots.forEach((dot, index) => {
            if (index + 1 === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update navigation buttons
        prevButton.disabled = currentSlide === 1;
        if (currentSlide === totalSlides) {
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = 'block';
        }
        
        // Reinitialize icons for new slide
        lucide.createIcons();
    }
    
    // Navigate to next slide
    function nextSlide() {
        if (currentSlide < totalSlides) {
            currentSlide++;
            updateSlide();
        }
    }
    
    // Navigate to previous slide
    function prevSlide() {
        if (currentSlide > 1) {
            currentSlide--;
            updateSlide();
        }
    }
    
    // Navigate to specific slide
    function goToSlide(slideNumber) {
        if (slideNumber >= 1 && slideNumber <= totalSlides) {
            currentSlide = slideNumber;
            updateSlide();
        }
    }
    
    // Handle email submission
    async function handleEmailSubmit(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (!email) {
            showEmailMessage('Please enter your email address.', 'error');
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showEmailMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        try {
            const response = await fetch('https://tour-email-capture-b52ovbio5q-uc.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            
            if (response.ok) {
                showEmailMessage('Thanks! We\'ll keep you updated.', 'success');
                emailInput.value = '';
            } else {
                showEmailMessage('Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting email:', error);
            showEmailMessage('Something went wrong. Please try again.', 'error');
        }
    }
    
    // Show email message
    function showEmailMessage(message, type) {
        emailMessage.textContent = message;
        emailMessage.className = `quick-tour-email-message ${type}`;
        setTimeout(() => {
            emailMessage.textContent = '';
            emailMessage.className = 'quick-tour-email-message';
        }, 5000);
    }
    
    // Event listeners
    if (yesButton) {
        yesButton.addEventListener('click', () => {
            window.openDemoFromSource?.('entry_modal');
        });
    }
    
    if (noButton) {
        noButton.addEventListener('click', closeEntryModal);
    }

    // Handle "See How This Happens" button in hero section
    const quickTourTrigger = document.getElementById('quick-tour-trigger');
    if (quickTourTrigger) {
        quickTourTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            window.openDemoFromSource?.('hero_cta');
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeWalkthrough);
    }
    
    if (continueButton) {
        continueButton.addEventListener('click', closeWalkthrough);
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', prevSlide);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', nextSlide);
    }
    
    // Progress dot navigation
    progressDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index + 1));
    });
    
    // Email form submission
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!walkthroughModal.classList.contains('show')) return;
        
        if (e.key === 'ArrowLeft' && !prevButton.disabled) {
            prevSlide();
        } else if (e.key === 'ArrowRight' && currentSlide < totalSlides) {
            nextSlide();
        } else if (e.key === 'Escape') {
            closeWalkthrough();
        }
    });
    
})();

// Exit intent modal (desktop only)
(function() {
    const EXIT_INTENT_KEY = 'exitIntentShown';
    const exitModal = document.getElementById('exit-intent-modal');
    if (!exitModal) {
        return;
    }

    const watchButton = document.getElementById('exit-intent-watch');
    const closeButton = document.getElementById('exit-intent-close');
    const quickTourTrigger = document.getElementById('quick-tour-trigger');
    const entryModal = document.getElementById('quick-tour-entry-modal');
    const walkthroughModal = document.getElementById('quick-tour-walkthrough');
    const supportsExitIntent = window.matchMedia('(pointer: fine)').matches;

    function canShowExitIntent() {
        if (!supportsExitIntent) {
            return false;
        }
        if (sessionStorage.getItem(EXIT_INTENT_KEY)) {
            return false;
        }
        if (exitModal.classList.contains('show')) {
            return false;
        }
        if (entryModal?.classList.contains('show') || walkthroughModal?.classList.contains('show')) {
            return false;
        }
        return true;
    }

    function showExitIntent() {
        if (!canShowExitIntent()) {
            return;
        }
        exitModal.classList.add('show');
        sessionStorage.setItem(EXIT_INTENT_KEY, 'true');
        lucide.createIcons();
    }

    function closeExitIntent() {
        exitModal.classList.remove('show');
    }

    if (watchButton) {
        watchButton.addEventListener('click', () => {
            closeExitIntent();
            if (window.openDemoFromSource) {
                window.openDemoFromSource('exit_intent');
            } else if (quickTourTrigger) {
                quickTourTrigger.click();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeExitIntent);
    }

    exitModal.addEventListener('click', (event) => {
        if (event.target === exitModal) {
            closeExitIntent();
        }
    });

    document.addEventListener('mouseleave', (event) => {
        if (event.clientY <= 0) {
            showExitIntent();
        }
    });

    document.addEventListener('mouseout', (event) => {
        if (event.relatedTarget || event.toElement) {
            return;
        }
        if (event.clientY <= 0) {
            showExitIntent();
        }
    });
})();
