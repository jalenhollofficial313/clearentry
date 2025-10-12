const ContinueButton = document.getElementById("ContinueButton")
const EmailInput = document.getElementById("EmailInput")
const PasswordInput = document.getElementById("PasswordInput")
const NameInput = document.getElementById("NameInput")
const ReferalInput = document.getElementById("ReferalInput")

async function signup_request(Name, Email, Password, ReferalCode) {
    const response = await fetch("https://add-account-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: Name,
            email: Email,
            password: Password,
            referal: ReferalCode
        })
    });

    const data = await response.text();
    console.log(data)

    if (data !== "Invalid Email") {
        localStorage.setItem("token", data);
        return data; 
    } else {
        return null;
    }
}

ContinueButton.addEventListener("click",  async function(){
    let Name = NameInput.value
    let Email = EmailInput.value 
    let Password = PasswordInput.value 
    let referal = ReferalInput.value
    let Token = await signup_request(Name, Email, Password, referal)
    if (Token != null && Token != "Invalid Email" && Token != "Invalid Password") {
        localStorage.setItem("token", Token)
        console.log(localStorage.getItem("token"))
        window.location.href = '../Dashboard/dashboard.html';
    }
})
