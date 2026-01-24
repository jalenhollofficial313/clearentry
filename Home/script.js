loginButton = document.getElementById("login-button");
signupButton = document.getElementById("signup-button");
signupButton2 = document.getElementById("signup-button2");
signoutButton = document.getElementById("signout-button");
dashboardButton = document.getElementById("dashboard-button");
dashboardButton2 = document.getElementById("dashboard-button2");
upgradeButton = document.getElementById("upgrade-button");




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

// Extension notification (show once)
(function() {
    const EXTENSION_NOTICE_KEY = "extensionNoticeDismissed";
    const extensionNotification = document.getElementById("extension-notification");
    const extensionClose = document.getElementById("extension-notification-close");

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

// Quick Tour Modal Functionality
(function() {
    const ENTRY_MODAL_KEY = 'quickTourEntryShown';
    const TOUR_COMPLETE_KEY = 'quickTourCompleted';
    
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
    
    // Show walkthrough modal
    function showWalkthrough() {
        entryModal.classList.remove('show');
        walkthroughModal.classList.add('show');
        sessionStorage.setItem(ENTRY_MODAL_KEY, 'true');
        currentSlide = 1;
        updateSlide();
        lucide.createIcons();
    }
    
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
        yesButton.addEventListener('click', showWalkthrough);
    }
    
    if (noButton) {
        noButton.addEventListener('click', closeEntryModal);
    }

    // Handle "See How This Happens" button in hero section
    const quickTourTrigger = document.getElementById('quick-tour-trigger');
    if (quickTourTrigger) {
        quickTourTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            showWalkthrough();
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
    
    // Initialize on page load
    if (shouldShowEntryModal()) {
        showEntryModal();
    }
})();
