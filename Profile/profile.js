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


profileINIT()