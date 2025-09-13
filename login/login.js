const ContinueButton = document.getElementById("ContinueButton")
const EmailInput = document.getElementById("EmailInput")
const PasswordInput = document.getElementById("PasswordInput")


async function login_request(Email, Password) {
    const response = await fetch("https://us-central1-clearentry-5353e.cloudfunctions.net/login_request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: Email,
            password: Password
        })
    })

    const token = await response.text()

    return token
}

ContinueButton.addEventListener("click",  async function(){
    let token = localStorage.getItem("token")
    if (token != null){
        return
    }

    let Email = EmailInput.value 
    let Password = PasswordInput.value 
    let Token = await login_request(Email, Password)
    if (Token != null && Token != "Invalid Email" && Token != "Invalid Password") {
        localStorage.setItem("token", Token)
        console.log(localStorage.getItem("token"))
        window.location.href = '../Dashboard/dashboard.html';
    }
})
