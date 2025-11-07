loginButton = document.getElementById("login-button");
signupButton = document.getElementById("signup-button");
signupButton2 = document.getElementById("signup-button2");
signoutButton = document.getElementById("signout-button");
dashboardButton = document.getElementById("dashboard-button");
dashboardButton2 = document.getElementById("dashboard-button2");




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