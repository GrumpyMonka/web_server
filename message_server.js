const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatHistory = [];

// Определяем режим запуска
const modeArg = process.argv.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'server';

if (mode === 'local') {
  app.use(express.static(path.join(__dirname, 'public')));
}

wss.on('connection', (ws) => {
  console.log('Пользователь подключился');
  ws.send(JSON.stringify({ type: 'chat_history', data: chatHistory }));

  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    if (message.type === 'new_message') {
      const chatMessage = {
        name: message.name,
        text: message.text,
        timestamp: new Date(),
      };
      chatHistory.push(chatMessage);

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat_message', data: chatMessage }));
        }
      });
    }
  });
});

if (mode === 'local') {
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Сервер запущен в режиме 'local' на порту ${PORT}`);
  });
} else {
  const SOCKET_PATH = '/tmp/nodeapp.sock';
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  server.listen(SOCKET_PATH, () => {
    fs.chmodSync(SOCKET_PATH, 0o766);
    console.log(`Сервер запущен в режиме 'server' на UNIX socket: ${SOCKET_PATH}`);
  });
}
