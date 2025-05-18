//работа с сервером подключение и получение сообщений с сервера
const socket = new WebSocket('wss://rasulhub.fun/ws/')
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  console.log(message);
  if (message.type === 'new_message') {
    addMessage(message.data);
  }
})

function sendMessage(jsonObject) {
  socket.send(JSON.stringify(jsonObject));
}
setInterval(sendMessage, 30000, { type: 'ping' })

let imageBase64;

const button = document.querySelector(".button");
if (button) {
  button.addEventListener("click", () => {
    const userName = document.getElementById('username').value;
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

const photo = document.querySelector('.photo');
if (photo) {
  photo.addEventListener('change', () => {
    const file = photo.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 300, 300);

        imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

}

const sendButton = document.querySelector('.sendButton');
if (sendButton) {
  sendButton.addEventListener('click', () => {
    const inputMessage = document.querySelector('.inputMessage');
    let val = inputMessage.value;
    if (val) {
      sendMessage({
        type: 'new_message',
        data: {
          name: localStorage.getItem("username"),
          text: val,
          imageData: imageBase64,
        }
      })

      inputMessage.value = '';
    }
  });
}

function addMessage(message) {
  const chat = document.querySelector('.chat');
  let div = document.createElement('div');
  let img = document.createElement('img');
  img.src = `data:image/png;base64,${message.imageData}`;
  div.className = 'message';
  div.innerHTML = `<b style="color:black">${message.name}</b>:<br /> ${message.text}`;
  div.appendChild(img);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}




