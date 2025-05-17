#!/bin/bash

set -e

CONFIG_NAME="server.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_CONF="$SCRIPT_DIR/$CONFIG_NAME"
DEST_CONF="/etc/nginx/sites-available/$CONFIG_NAME"
LINK_CONF="/etc/nginx/sites-enabled/$CONFIG_NAME"

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

echo "Готово! nginx запущен с новым конфигом."
