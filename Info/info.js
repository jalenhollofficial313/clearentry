document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-icon").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
});

