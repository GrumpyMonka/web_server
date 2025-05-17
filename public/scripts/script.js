const socket = new WebSocket('wss://v157394.hosted-by-vdsina.com/socket')
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  console.log(message);
  if (message.type === 'chat_history') {

  }
  if (message.type === 'chat_message') {
  }
})

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


const sendButton = document.querySelector('.sendButton');
if (sendButton) {
  sendButton.addEventListener('click', () => {
    const inputMessage = document.querySelector('.inputMessage');
    let val = inputMessage.value;
    if (val) {
      socket.send(JSON.stringify({ type: 'new_message', name: 'Rasul', text: val }))
      inputMessage.value = '';
    }
  });
}