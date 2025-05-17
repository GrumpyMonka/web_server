#!/bin/bash

set -e

CONFIG_NAME="server.conf"
PM2_PROCESS_NAME="chat-server"
SERVER_SCRIPT="message_server.js"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_CONF="$SCRIPT_DIR/$CONFIG_NAME"
DEST_CONF="/etc/nginx/sites-available/$CONFIG_NAME"
LINK_CONF="/etc/nginx/sites-enabled/$CONFIG_NAME"
SERVER_PATH="$SCRIPT_DIR/$SERVER_SCRIPT"

echo "Копируем конфиг nginx..."
sudo cp "$SRC_CONF" "$DEST_CONF"

echo "Создаем символическую ссылку в sites-enabled..."
if [ -L "$LINK_CONF" ]; then
    sudo rm "$LINK_CONF"
fi
sudo ln -s "$DEST_CONF" "$LINK_CONF"

echo "Удаляем стандартный конфиг nginx (если есть)..."
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm "/etc/nginx/sites-enabled/default"
fi

echo "Проверяем конфигурацию nginx..."
sudo nginx -t

echo "Перезагружаем nginx..."
sudo systemctl reload nginx

echo "Запускаем или перезапускаем сервер через PM2..."
if pm2 list | grep -q "$PM2_PROCESS_NAME"; then
    pm2 restart "$PM2_PROCESS_NAME"
else
    pm2 start "$SERVER_PATH" --name "$PM2_PROCESS_NAME"
fi

echo "Сохраняем конфигурацию PM2 для автозапуска..."
pm2 save
pm2 startup --silent | sudo tee /dev/null > /dev/null

echo "✅ Готово! nginx и pm2-сервер запущены."
