const buttons1 = document.getElementsByClassName("header-button")
const buttons2 = document.getElementsByClassName("CTA-button")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function logOut(token) {
    const response = await fetch("https://logout-request-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })

    return await response.text()
}

async function init() {
    window.location.href = "../Home/index.html"
}

buttons1[2].addEventListener("click", async function(params) {
    if (localStorage.getItem("token") != null) {
        await logOut(localStorage.getItem("token"))
    }
    await localStorage.removeItem("token");
    location.reload();
})

buttons2[2].addEventListener("click", async function(params) {
    if (localStorage.getItem("token") != null) {
        await logOut(localStorage.getItem("token"))
    }
    await localStorage.removeItem("token");
    location.reload();
})

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href"))
      .scrollIntoView({
        behavior: "smooth",
        block: "start"   // align to top
      });
  });
});

init()