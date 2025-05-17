#!/bin/bash

set -e

MODE="$1"
CONFIG_NAME="server.conf"
PM2_PROCESS_NAME="chat-server"
SERVER_SCRIPT="message_server.js"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_CONF="$SCRIPT_DIR/$CONFIG_NAME"
DEST_CONF="/etc/nginx/sites-available/$CONFIG_NAME"
LINK_CONF="/etc/nginx/sites-enabled/$CONFIG_NAME"
SERVER_PATH="$SCRIPT_DIR/$SERVER_SCRIPT"

echo "▶️ Режим запуска: ${MODE:-server}"
echo "📁 Каталог скрипта: $SCRIPT_DIR"
echo "📄 Путь к серверному скрипту: $SERVER_PATH"

# Проверка наличия скрипта
if [ ! -f "$SERVER_PATH" ]; then
    echo "❌ Ошибка: не найден скрипт $SERVER_PATH"
    exit 1
fi

if [ "$MODE" == "local" ]; then
    echo "🚀 Запуск в режиме local..."
    echo "👉 Команда: node \"$SERVER_PATH\" --mode=local"
    node "$SERVER_PATH" --mode=local
    exit 0
fi

echo "🛠 Копируем конфиг nginx..."
sudo cp "$SRC_CONF" "$DEST_CONF"

echo "🔗 Создаем символическую ссылку в sites-enabled..."
if [ -L "$LINK_CONF" ]; then
    echo "ℹ️ Удаляем существующую ссылку: $LINK_CONF"
    sudo rm "$LINK_CONF"
fi
sudo ln -s "$DEST_CONF" "$LINK_CONF"

echo "🧹 Удаляем стандартный конфиг nginx (если есть)..."
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm "/etc/nginx/sites-enabled/default"
fi

echo "🔍 Проверяем конфигурацию nginx..."
sudo nginx -t

echo "🔄 Перезагружаем nginx..."
sudo systemctl reload nginx

echo "🚦 Запускаем или перезапускаем сервер через PM2..."
if pm2 list | grep -q "$PM2_PROCESS_NAME"; then
    echo "♻️ Перезапуск процесса PM2: $PM2_PROCESS_NAME"
    pm2 restart "$PM2_PROCESS_NAME"
else
    echo "🆕 Старт нового PM2 процесса: $PM2_PROCESS_NAME"
    echo "👉 Команда: pm2 start \"$SERVER_PATH\" --name \"$PM2_PROCESS_NAME\" -- --mode=server"
    pm2 start "$SERVER_PATH" --name "$PM2_PROCESS_NAME" -- --mode=server
fi

echo "💾 Сохраняем конфигурацию PM2 для автозапуска..."
pm2 save
pm2 startup --silent | sudo tee /dev/null > /dev/null

echo "📋 Текущий список процессов PM2:"
pm2 list

echo "🧾 Логи PM2 процесса $PM2_PROCESS_NAME:"
pm2 logs "$PM2_PROCESS_NAME" --lines 10

echo "✅ Готово! nginx и PM2-сервер запущены."
