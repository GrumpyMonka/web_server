const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const expressApp = express();
const httpServer = http.createServer(expressApp);
const webSocketServer = new WebSocket.Server({ server: httpServer });

const modeArgument = process.argv.find(arg => arg.startsWith('--mode='));
const applicationMode = modeArgument ? modeArgument.split('=')[1] : 'server';

const isFileLoggingEnabled = applicationMode === 'server';
const logFilePath = path.join(__dirname, 'server.log');

// Функция логирования
function logToConsoleAndFile(message) {
  const timestamp = new Date().toISOString();
  const formattedLogMessage = `[${timestamp}] ${message}`;

  console.log(formattedLogMessage);

  if (isFileLoggingEnabled) {
    fs.appendFile(logFilePath, formattedLogMessage + '\n', (error) => {
      if (error) {
        console.error(`[${timestamp}] Ошибка при записи в лог-файл:`, error);
      }
    });
  }
}

// Статика в режиме local
if (applicationMode === 'local') {
  expressApp.use(express.static(path.join(__dirname, 'public')));
}

// Обработка WebSocket-соединений
webSocketServer.on('connection', (webSocketClient) => {
  logToConsoleAndFile('Пользователь подключился');

  webSocketClient.on('message', (incomingMessage) => {
  try {
    const parsedMessage = JSON.parse(incomingMessage);

    if (parsedMessage.type === 'new_message') {
      const senderName = parsedMessage.data?.name || 'Неизвестный пользователь';

      // Определяем, пришло ли изображение
      const isImage = parsedMessage.data?.imageData && parsedMessage.data.imageData.trim() !== '';

      const logContent = isImage
        ? `${senderName} отправил(а) изображение`
        : `${senderName}: ${parsedMessage.data?.text || ''}`;

      logToConsoleAndFile(logContent);

      // Отправляем всем клиентам, включая отправителя
      broadcastToAllClients(parsedMessage);
    }
  } catch (error) {
    logToConsoleAndFile(`Ошибка при обработке сообщения: ${error.message}`);
  }
});

});

// Рассылка всем клиентам
function broadcastToAllClients(messageObject) {
  const serializedMessage = JSON.stringify(messageObject);
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serializedMessage);
    }
  });
}

// Запуск сервера
if (applicationMode === 'local') {
  const localPort = 3000;
  httpServer.listen(localPort, () => {
    logToConsoleAndFile(`Сервер запущен в режиме 'local' - http://localhost:${localPort}`);
  });
} else {
  const unixSocketPath = '/tmp/nodeapp.sock';
  if (fs.existsSync(unixSocketPath)) {
    fs.unlinkSync(unixSocketPath);
  }
  httpServer.listen(unixSocketPath, () => {
    fs.chmodSync(unixSocketPath, 0o766);
    logToConsoleAndFile(`Сервер запущен в режиме 'server' на UNIX socket: ${unixSocketPath}`);
  });
}
