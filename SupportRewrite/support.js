const supportForm = document.getElementById("support-form");
const emailInput = document.getElementById("support-email");
const discordInput = document.getElementById("support-discord");
const descriptionInput = document.getElementById("support-description");
const screenshotInput = document.getElementById("support-screenshot");
const screenshotName = document.getElementById("screenshot-name");
const submitButton = document.getElementById("support-submit-button");
const supportMessage = document.getElementById("support-message");
const emailError = document.getElementById("email-error");
const descriptionError = document.getElementById("description-error");
const screenshotError = document.getElementById("screenshot-error");
const loadFrame = document.getElementById("load-frame");
const loadedFrame = document.getElementById("loaded-frame");
const mainframeLoading = document.querySelector(".mainframe-loading");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const maxScreenshotBytes = 8 * 1024 * 1024;

const validateEmail = (email) => emailRegex.test(email);
const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

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
        "https://us-central1-clearentry-5353e.cloudfunctions.net/support_request",
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
                screenshot: formData.screenshot || null,
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
    clearError(screenshotError);
    hideMessage();

    const email = emailInput.value.trim();
    const discord = discordInput.value.trim();
    const description = descriptionInput.value.trim();
    const screenshotFile = screenshotInput.files[0] || null;

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
    if (screenshotFile) {
        if (!allowedImageTypes.includes(screenshotFile.type)) {
            showError(
                screenshotError,
                "Please upload PNG, JPG, or WEBP screenshot files."
            );
            isValid = false;
        } else if (screenshotFile.size > maxScreenshotBytes) {
            showError(screenshotError, "Screenshot must be 8MB or less.");
            isValid = false;
        }
    }

    if (!isValid) {
        return;
    }

    setLoading(true);
    try {
        let screenshotPayload = null;
        if (screenshotFile) {
            const dataUrl = await fileToDataUrl(screenshotFile);
            screenshotPayload = {
                name: screenshotFile.name,
                type: screenshotFile.type,
                dataUrl,
            };
        }

        const result = await submitSupportRequest({
            email,
            discord,
            description,
            screenshot: screenshotPayload,
        });
        if (result.success) {
            setSuccess();
            showMessage(
                "Support request submitted successfully! We'll get back to you soon.",
                "success"
            );
            supportForm.reset();
            screenshotName.textContent = "No file selected";
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

screenshotInput.addEventListener("change", () => {
    clearError(screenshotError);
    const file = screenshotInput.files[0];
    if (!file) {
        screenshotName.textContent = "No file selected";
        return;
    }

    screenshotName.textContent = file.name;

    if (!allowedImageTypes.includes(file.type)) {
        showError(screenshotError, "Please upload PNG, JPG, or WEBP screenshot files.");
        return;
    }

    if (file.size > maxScreenshotBytes) {
        showError(screenshotError, "Screenshot must be 8MB or less.");
    }
});

