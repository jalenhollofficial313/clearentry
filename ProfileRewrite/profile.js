const MembershipText = document.getElementById("MembershipText");
const NameText = document.getElementById("NameText");
const BioText = document.getElementById("BioText");
const EmailText = document.getElementById("EmailText");

const NameTextH = document.getElementById("NameTextH");
const EmailTextH = document.getElementById("EmailTextH");
const MembershipTextH = document.getElementById("MembershipTextH");

const SaveButton = document.getElementById("SaveButton");
const LogoutButton = document.getElementById("logout-button");

const profileNotify = (message, type = "error") => {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.warn(message);
    }
};



function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadProfileData(data) {
    console.log(data)
    if (!data) return false;
    MembershipText.textContent = data["membership"] || "—";
    MembershipTextH.textContent = data["membership"]
        ? `${data["membership"]} Member`
        : "Member";

    NameText.value = data["name"] || "";
    NameTextH.textContent = data["name"] || "—";

    BioText.value = data["bio"] || "";

    EmailText.value = data["email"] || "";
    EmailTextH.textContent = data["email"] || "—";

    const cancelSection = document.getElementById("membership-cancel-section");
    if (cancelSection) {
        const membership = data["membership"];
        if (membership && membership.toLowerCase() === "pro") {
            cancelSection.style.display = "block";
        } else {
            cancelSection.style.display = "none";
        }
    }

    return true;
}

async function profileINIT() {
    await getClientData();
    await sleep(100);
    await loadProfileData(clientData?.result);
}

async function saveData(token) {
    const response = await fetch("https://change-data-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: token,
            email: EmailText.value,
            name: NameText.value,
            bio: BioText.value,
        }),
    });

    return await response.text();
}

SaveButton.addEventListener("click", async () => {
    const token = await getAuthToken();
    if (!token) return;
    const saved = await saveData(token);
    if (saved === "Invalid Email") {
        EmailText.value = "INVALID EMAIL";
        EmailText.style.color = "red";
        await sleep(1000);
        EmailText.value = "";
        EmailText.style.color = "";
    }
    profileINIT();
});

async function signOutUser() {
    try {
        if (window.firebase?.auth) {
            await firebase.auth().signOut();
        }
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        localStorage.removeItem("token");
        window.location.href = LOGIN_REDIRECT;
    }
}

async function cancelMembership(token) {
    const response = await fetch(
        "https://cancel-subscription-b52ovbio5q-uc.a.run.app",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
            }),
        }
    );

    return await response.text();
}

document.addEventListener("DOMContentLoaded", () => {
    const barIcon = document.querySelector("#bar-icon");
    const sidebar = document.querySelector("#sidebar");
    if (barIcon && sidebar) {
        barIcon.addEventListener("click", () => {
            sidebar.style.display = "block";
        });
    }

    const cancelMembershipButton = document.getElementById(
        "cancel-membership-button"
    );
    if (cancelMembershipButton) {
        cancelMembershipButton.addEventListener("click", async () => {
            const confirmMessage =
                "Are you sure you want to cancel your subscription? Your access will continue until the end of your current billing period.";
            const confirmed = await window.showConfirm(confirmMessage, {
                title: "Cancel Subscription",
                confirmText: "Cancel subscription",
            });
            if (!confirmed) {
                return;
            }

            cancelMembershipButton.disabled = true;
            cancelMembershipButton.textContent = "Cancelling...";

            try {
                const token = await getAuthToken();
                if (!token) return;
                const result = await cancelMembership(token);
                if (result === "Success") {
                    profileNotify(
                        "Your subscription has been cancelled. Your access will continue until the end of your billing period.",
                        "success"
                    );
                    await profileINIT();
                } else {
                    profileNotify(`Failed to cancel subscription: ${result}`, "error");
                    cancelMembershipButton.disabled = false;
                    cancelMembershipButton.textContent = "Cancel Subscription";
                }
            } catch (error) {
                console.error("Error cancelling subscription:", error);
                profileNotify(
                    "An error occurred while cancelling your subscription. Please try again.",
                    "error"
                );
                cancelMembershipButton.disabled = false;
                cancelMembershipButton.textContent = "Cancel Subscription";
            }
        });
    }

    const resetPasswordButton = document.getElementById("reset-password-button");
    if (resetPasswordButton) {
        resetPasswordButton.addEventListener("click", async () => {
            await getClientData();
            const userEmail = clientData?.result?.email || "";
            if (typeof openPasswordResetModal === "function") {
                openPasswordResetModal(userEmail);
            }
        });
    }

    if (LogoutButton) {
        LogoutButton.addEventListener("click", async () => {
            await signOutUser();
        });
    }
});

profileINIT();

