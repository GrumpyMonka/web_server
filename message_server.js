const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatHistory = [];

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log('Пользователь подключился');
  ws.send(JSON.stringify({ type: 'chat_history', data: chatHistory }));

  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    if (message.type === 'new_message') {
      console.log(message);
      const chatMessage = { name: message.name, text: message.text, timestamp: new Date() };
      chatHistory.push(chatMessage);

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat_message', data: chatMessage }));
        }
      });
    }
  });
});

const SOCKET_PATH = '/tmp/nodeapp.sock';

// Удаляем сокет, если он существует (чтобы не было ошибки bind)
if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}

server.listen(SOCKET_PATH, () => {
  // Меняем права, чтобы Nginx мог к нему обращаться
  fs.chmodSync(SOCKET_PATH, 0o766);
  console.log(`Сервер запущен на UNIX socket: ${SOCKET_PATH}`);
});
