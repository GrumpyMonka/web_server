const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatHistory = [];

app.use(express.static(path.join(__dirname, 'public'))); // отдача статики

wss.on('connection', (ws) => {
  console.log('Пользователь подключился');
  ws.send(JSON.stringify({ type: 'chat_history', data: chatHistory }));

  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    if (message.type === 'new_message') {
      const chatMessage = { name: message.name, text: message.text, timestamp: new Date() };
      chatHistory.push(chatMessage);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat_message', data: chatMessage }));
        }
      });
    }
  });
});

server.listen(3000, () => console.log('Сервер работает на http://localhost:3000'));
