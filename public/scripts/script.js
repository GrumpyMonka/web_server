const button = document.querySelector(".button");
if (button) {
  button.addEventListener("click", () => {
    window.location.href = "/pages/chat.html";
  });
}

const button2 = document.querySelector(".button2");
if (button2) {
  button2.addEventListener("click", () => {
    console.log("mem");
    window.location.href = "/index.html";
  });
}
