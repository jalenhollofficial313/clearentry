const buttons1 = document.getElementsByClassName("header-button")
const buttons2 = document.getElementsByClassName("CTA-button")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
    console.log(window.innerWidth)
    if (window.innerWidth < 768) {
        return
    }
    if (localStorage.getItem("token") != null) {
        buttons1[0].style.display = "none";
        buttons1[1].style.display = "none";

        buttons1[2].style.display = "block";
        buttons1[3].style.display = "block";

        buttons2[0].style.display = "none";
        buttons2[1].style.display = "none";

        buttons2[2].style.display = "block";
        buttons2[3].style.display = "block";
    }   
}

buttons1[2].addEventListener("click", async function(params) {
    await localStorage.removeItem("token");
    location.reload();
})

buttons2[2].addEventListener("click", async function(params) {
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