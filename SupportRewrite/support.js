const supportForm = document.getElementById("support-form");
const emailInput = document.getElementById("support-email");
const discordInput = document.getElementById("support-discord");
const descriptionInput = document.getElementById("support-description");
const submitButton = document.getElementById("support-submit-button");
const supportMessage = document.getElementById("support-message");
const emailError = document.getElementById("email-error");
const descriptionError = document.getElementById("description-error");
const loadFrame = document.getElementById("load-frame");
const loadedFrame = document.getElementById("loaded-frame");
const mainframeLoading = document.querySelector(".mainframe-loading");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => emailRegex.test(email);

const showError = (element, message) => {
    element.textContent = message;
    element.style.display = "block";
};

const clearError = (element) => {
    element.textContent = "";
    element.style.display = "none";
};

const showMessage = (message, type) => {
    supportMessage.textContent = message;
    supportMessage.className = `support-message ${type}`;
    supportMessage.style.display = "block";
    supportMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const hideMessage = () => {
    supportMessage.style.display = "none";
    supportMessage.className = "support-message";
};

const setLoading = (isLoading) => {
    if (isLoading) {
        mainframeLoading.style.display = "flex";
        loadFrame.style.display = "flex";
        loadedFrame.style.display = "none";
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
    } else {
        mainframeLoading.style.display = "none";
        submitButton.disabled = false;
        submitButton.textContent = "Submit Request";
    }
};

const setSuccess = () => {
    loadFrame.style.display = "none";
    loadedFrame.style.display = "flex";
    setTimeout(() => {
        mainframeLoading.style.display = "none";
    }, 1000);
};

async function submitSupportRequest(formData) {
    const token = window.getAuthToken ? await window.getAuthToken() : null;
    if (!token) {
        throw new Error("Please log in to submit a support request.");
    }
    const response = await fetch(
        "https://support-request-b52ovbio5q-uc.a.run.app",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                email: formData.email,
                discord: formData.discord || "N/A",
                description: formData.description,
            }),
        }
    );

    const result = await response.text();
    if (response.ok && result === "Success") {
        return { success: true };
    }
    throw new Error(result || "Request failed");
}

supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(emailError);
    clearError(descriptionError);
    hideMessage();

    const email = emailInput.value.trim();
    const discord = discordInput.value.trim();
    const description = descriptionInput.value.trim();

    let isValid = true;
    if (!email) {
        showError(emailError, "Email is required");
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailError, "Please enter a valid email address");
        isValid = false;
    }

    if (!description) {
        showError(descriptionError, "Problem description is required");
        isValid = false;
    } else if (description.length < 10) {
        showError(descriptionError, "Please provide more details (at least 10 characters)");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    setLoading(true);
    try {
        const result = await submitSupportRequest({
            email,
            discord,
            description,
        });
        if (result.success) {
            setSuccess();
            showMessage(
                "Support request submitted successfully! We'll get back to you soon.",
                "success"
            );
            supportForm.reset();
            setTimeout(() => {
                hideMessage();
            }, 5000);
        }
    } catch (error) {
        console.error("Error submitting support request:", error);
        showMessage(
            error.message ||
                "Failed to submit support request. Please try again.",
            "error"
        );
    } finally {
        setLoading(false);
    }
});

emailInput.addEventListener("blur", () => {
    const email = emailInput.value.trim();
    if (email && !validateEmail(email)) {
        showError(emailError, "Please enter a valid email address");
    } else {
        clearError(emailError);
    }
});

descriptionInput.addEventListener("input", () => {
    const description = descriptionInput.value.trim();
    if (description && description.length < 10) {
        showError(descriptionError, "Please provide more details (at least 10 characters)");
    } else {
        clearError(descriptionError);
    }
});

