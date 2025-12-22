#!/bin/bash

# Bash скрипт для развертывания на сервер через SSH
# Использование: ./deploy-to-server.sh

SERVER_IP="212.113.123.94"
SERVER_USER="root"
SERVER_PASS="wNaqg6r+wRUDV?"
PROJECT_DIR="/root/corporate-learning-platform-v2"

echo "=========================================="
echo "🚀 Развертывание на сервер"
echo "=========================================="
echo ""

# Проверка наличия sshpass или запрос пароля
if command -v sshpass &> /dev/null; then
    SSH_CMD="sshpass -p '$SERVER_PASS' ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP"
else
    echo "⚠️  sshpass не установлен. Будет запрошен пароль."
    echo "   Установите: sudo apt-get install sshpass (или brew install sshpass)"
    echo ""
    SSH_CMD="ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP"
fi

echo "1. Подключение к серверу и запуск setup-and-run.sh..."
echo ""

$SSH_CMD << EOF
cd $PROJECT_DIR
chmod +x setup-and-run.sh
./setup-and-run.sh
EOF

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "Проверьте работу приложения:"
echo "   http://$SERVER_IP:3044"
echo ""
echo "Для просмотра логов:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo "   docker logs -f corporate_learning_app"
echo ""


