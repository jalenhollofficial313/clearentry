loginButton = document.getElementById("LoginButton");
signupButton = document.getElementById("SignUpButton");
signoutButton = document.getElementById("SignOutButton");
dashboardButton = document.getElementById("DashBoardButton");



signoutButton.addEventListener("click", function(){
    if (localStorage.getItem("token")) {
        localStorage.removeItem("token")
    }

    if (localStorage.getItem("token") != null) {
        console.log("Check")
        loginButton.style.display = "None";
        signupButton.style.display = "None";
        signoutButton.style.display = "unset";
        dashboardButton.style.display = "unset";
    } else {
        loginButton.style.display = "unset";
        signupButton.style.display = "unset";
        signoutButton.style.display = "None";
        dashboardButton.style.display = "None";

    }
})


if (localStorage.getItem("token") != null) {
    console.log("Check")
    loginButton.style.display = "None";
    signupButton.style.display = "None";
    signoutButton.style.display = "unset";
    dashboardButton.style.display = "unset";
} else {
    loginButton.style.display = "unset";
    signupButton.style.display = "unset";
    signoutButton.style.display = "None";
    dashboardButton.style.display = "None";

}