const MembershipText = document.getElementById("MembershipText")
const NameText = document.getElementById("NameText")
const BioText = document.getElementById("BioText")
const EmailText = document.getElementById("EmailText")

const NameTextH = document.getElementById("NameTextH")
const EmailTextH = document.getElementById("EmailTextH")
const MembershipTextG = document.getElementById("MembershipTextGR")

const SaveButton = document.getElementById("SaveButton")


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function loadProfileData(data) {
    MembershipText.innerHTML = data['membership']
    MembershipTextH.innerHTML = data['membership'] + " Member"

    NameText.value = data['name']
    NameTextH.innerHTML = data['name']

    BioText.value = data['bio']

    EmailText.value = data['email']
    EmailTextH.innerHTML = data['email']
    
    // Show cancel membership section only for Pro members
    const cancelSection = document.getElementById("membership-cancel-section");
    if (cancelSection) {
        const membership = data['membership'];
        // Only show for Pro members, hide for all others (Standard, etc.)
        if (membership && membership.toLowerCase() === 'pro') {
            cancelSection.style.display = 'block';
        } else {
            cancelSection.style.display = 'none';
        }
    }
    
    return true
}

async function profileINIT() {
    await getClientData()
    await sleep(100)
    await loadProfileData(clientData.result)
}

async function saveData(token) {
    const response = await fetch("https://change-data-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            email: EmailText.value,
            name: NameText.value,
            bio: BioText.value,
        })
    })

    const dataSave = await response.text()

    return dataSave 
}

SaveButton.addEventListener("click", async function(){
    const saved = await saveData(localStorage.getItem("token"))
    if (saved == "Invalid Email") {
        EmailText.value = "INVALID EMAIL"
        EmailText.style.color = "red"
        await sleep(1000)
        EmailText.value = ""
        EmailText.style.color = "black"
    }
    profileINIT()
})

async function cancelMembership(token) {
    const response = await fetch("https://cancel-subscription-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })

    const result = await response.text()
    return result
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-icon").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
  
  const cancelMembershipButton = document.getElementById("cancel-membership-button");
  if (cancelMembershipButton) {
      cancelMembershipButton.addEventListener("click", async function() {
          if (!confirm("Are you sure you want to cancel your subscription? Your access will continue until the end of your current billing period.")) {
              return;
          }
          
          cancelMembershipButton.disabled = true;
          cancelMembershipButton.textContent = "Cancelling...";
          
          try {
              const result = await cancelMembership(localStorage.getItem("token"));
              if (result === "Success") {
                  alert("Your subscription has been cancelled. Your access will continue until the end of your billing period.");
                  // Reload profile data to update membership status
                  await profileINIT();
              } else {
                  alert("Failed to cancel subscription: " + result);
                  cancelMembershipButton.disabled = false;
                  cancelMembershipButton.textContent = "Cancel Subscription";
              }
          } catch (error) {
              console.error("Error cancelling subscription:", error);
              alert("An error occurred while cancelling your subscription. Please try again.");
              cancelMembershipButton.disabled = false;
              cancelMembershipButton.textContent = "Cancel Subscription";
          }
      });
  }
  
  // Reset Password Button
  const resetPasswordButton = document.getElementById("reset-password-button");
  if (resetPasswordButton) {
      resetPasswordButton.addEventListener("click", async function() {
          // Get user email from profile data
          await getClientData();
          const userEmail = clientData?.result?.email || '';
          if (typeof openPasswordResetModal === 'function') {
              openPasswordResetModal(userEmail);
          }
      });
  }
});



profileINIT()