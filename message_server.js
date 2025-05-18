const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatHistory = [];

const modeArg = process.argv.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'server';

const enableFileLogging = mode === 'server';
const LOG_FILE = path.join(__dirname, 'server.log');

// Функция логирования
function logToFile(message) {
  if (!enableFileLogging) return;

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFile(LOG_FILE, logMessage, (err) => {
    if (err) {
      console.error('Ошибка при записи в лог-файл:', err);
    }
  });
}

if (mode === 'local') {
  app.use(express.static(path.join(__dirname, 'public')));
}

wss.on('connection', (ws) => {
  console.log('Пользователь подключился');
  logToFile('Пользователь подключился');

  ws.send(JSON.stringify({ type: 'chat_history', data: chatHistory }));

  ws.on('message', (msg) => {
    console.log(`New message ${msg}`);
    const message = JSON.parse(msg);
    if (message.type === 'new_message') {
      const chatMessage = {
        name: message.name,
        text: message.text,
        timestamp: new Date(),
      };
      chatHistory.push(chatMessage);

      const logMsg = `${chatMessage.name}: ${chatMessage.text}`;
      logToFile(`Новое сообщение: ${logMsg}`);

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
    const msg = `Сервер запущен в режиме 'local' - http://localhost:${PORT}`;
    console.log(msg);
  });
} else {
  const SOCKET_PATH = '/tmp/nodeapp.sock';
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  server.listen(SOCKET_PATH, () => {
    fs.chmodSync(SOCKET_PATH, 0o766);
    const msg = `Сервер запущен в режиме 'server' на UNIX socket: ${SOCKET_PATH}`;
    console.log(msg);
    logToFile(msg);
  });
}
