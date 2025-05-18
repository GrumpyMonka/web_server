const socket = new WebSocket('wss://rasulhub.fun/ws/')
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  console.log(message);
  if (message.type === 'chat_history') {

  }
  if (message.type === 'chat_message') {
    addMessage(message.data);
  }
})

let userName = 'noName';

const button = document.querySelector(".button");
if (button) {
  button.addEventListener("click", () => {
    userName = document.getElementById('username').value;
    localStorage.setItem("username", userName);
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


const sendButton = document.querySelector('.sendButton');
if (sendButton) {
  sendButton.addEventListener('click', () => {
    const inputMessage = document.querySelector('.inputMessage');
    let val = inputMessage.value;
    if (val) {
      socket.send(JSON.stringify({ type: 'new_message', name: localStorage.getItem("username"), text: val }))
      inputMessage.value = '';
    }
  });

}

function addMessage(message) {
  const chat = document.querySelector('.chat');
  let div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<b style="color:black">${message.name}</b>:<br /> ${message.text}`;
  chat.appendChild(div);
}
