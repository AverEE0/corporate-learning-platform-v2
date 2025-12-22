#!/bin/bash

# Скрипт для настройки SSL сертификата для ykz.tw1.ru

echo "=== Настройка SSL для ykz.tw1.ru ==="

DOMAIN="ykz.tw1.ru"
EMAIL="admin@${DOMAIN}"  # Измените на ваш email

# Проверяем, запущен ли certbot
if ! command -v certbot &> /dev/null; then
    echo "Устанавливаю certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# Останавливаем nginx временно для получения сертификата
echo "Останавливаю nginx для получения сертификата..."
docker-compose -f docker-compose.prod.yml stop nginx

# Получаем сертификат
echo "Получаю SSL сертификат для ${DOMAIN}..."
sudo certbot certonly --standalone \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ Сертификат получен успешно"
    
    # Копируем сертификаты в директорию проекта
    echo "Копирую сертификаты..."
    sudo mkdir -p ssl
    sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ssl/
    sudo chmod 644 ssl/fullchain.pem
    sudo chmod 600 ssl/privkey.pem
    sudo chown $USER:$USER ssl/*.pem
    
    # Обновляем nginx.conf для использования SSL версии
    if [ -f nginx-ssl.conf ]; then
        echo "Переключаюсь на SSL конфигурацию..."
        cp nginx.conf nginx-http-backup.conf
        cp nginx-ssl.conf nginx.conf
        
        # Обновляем docker-compose для использования SSL конфига
        sed -i.bak 's|nginx.conf|nginx.conf|' docker-compose.prod.yml
    else
        echo "⚠️  Файл nginx-ssl.conf не найден, обновите nginx.conf вручную"
    fi
    
    # Запускаем nginx снова
    echo "Запускаю nginx с SSL..."
    docker-compose -f docker-compose.prod.yml up -d nginx
    
    echo ""
    echo "✅ SSL настроен успешно!"
    echo ""
    echo "Проверьте доступность:"
    echo "  HTTPS: https://${DOMAIN}"
    echo "  Health: https://${DOMAIN}/api/health"
    echo ""
    echo "Настройте автообновление сертификатов:"
    echo "  sudo crontab -e"
    echo "  Добавьте: 0 0 1 * * certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx"
else
    echo "❌ Ошибка при получении сертификата"
    echo "Запускаю nginx без SSL..."
    docker-compose -f docker-compose.prod.yml up -d nginx
    exit 1
fi

