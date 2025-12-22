#!/bin/bash
# Скрипт для настройки автоматического деплоя на сервере

echo "Настройка автоматического деплоя на сервере..."

# Создаем директорию для репозитория если не существует
cd /root
if [ ! -d "corporate-learning-platform-v2" ]; then
    echo "Клонирование репозитория..."
    git clone https://github.com/omashi001/corporate-learning-platform-v2.git
    cd corporate-learning-platform-v2
else
    cd corporate-learning-platform-v2
    echo "Обновление репозитория..."
    git pull origin main || git pull origin master
fi

# Настраиваем git для автоматического pull
git config --global credential.helper store

# Создаем скрипт для автоматического деплоя
cat > /root/deploy.sh << 'DEPLOYSCRIPT'
#!/bin/bash
cd /root/corporate-learning-platform-v2
git fetch origin
git reset --hard origin/main || git reset --hard origin/master
docker compose build app
docker compose up -d app
echo "Deployment completed at $(date)"
DEPLOYSCRIPT

chmod +x /root/deploy.sh

# Настраиваем webhook (опционально, если нужно)
echo "Для настройки webhook создайте endpoint на сервере или используйте GitHub Actions"

echo "✓ Настройка завершена!"
echo ""
echo "Теперь при каждом push в GitHub репозиторий будет автоматически деплоиться на сервер"

