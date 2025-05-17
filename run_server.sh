#!/bin/bash

set -e

MODE="$1"
LOG_FLAG="$2"
CONFIG_NAME="server.conf"
PM2_PROCESS_NAME="chat-server"
SERVER_SCRIPT="message_server.js"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_CONF="$SCRIPT_DIR/$CONFIG_NAME"
DEST_CONF="/etc/nginx/sites-available/$CONFIG_NAME"
LINK_CONF="/etc/nginx/sites-enabled/$CONFIG_NAME"
SERVER_PATH="$SCRIPT_DIR/$SERVER_SCRIPT"

log() {
    echo "$1"
}

log "Режим запуска: ${MODE:-server}"

if [ ! -f "$SERVER_PATH" ]; then
    echo "Ошибка: не найден скрипт $SERVER_PATH"
    exit 1
fi

if [ "$MODE" == "local" ]; then
    echo "Запуск в режиме local..."
    node "$SERVER_PATH" --mode=local
    exit 0
fi

echo "Копируем конфиг nginx..."
sudo cp "$SRC_CONF" "$DEST_CONF"

echo "Создаем символическую ссылку в sites-enabled..."
if [ -L "$LINK_CONF" ]; then
    sudo rm "$LINK_CONF"
fi
sudo ln -s "$DEST_CONF" "$LINK_CONF"

if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm "/etc/nginx/sites-enabled/default"
fi

echo "Проверяем конфигурацию nginx..."
sudo nginx -t

echo "Перезагружаем nginx..."
sudo systemctl reload nginx

echo "Запуск или перезапуск PM2..."
if pm2 list | grep -q "$PM2_PROCESS_NAME"; then
    pm2 restart "$PM2_PROCESS_NAME"
else
    pm2 start "$SERVER_PATH" --name "$PM2_PROCESS_NAME" -- --mode=server
fi

pm2 save
pm2 startup --silent | sudo tee /dev/null > /dev/null

if [ "$LOG_FLAG" == "logs" ]; then
    echo "Логи PM2 процесса $PM2_PROCESS_NAME:"
    pm2 logs "$PM2_PROCESS_NAME" --lines 10
fi

echo "Готово. nginx и PM2-сервер запущены."