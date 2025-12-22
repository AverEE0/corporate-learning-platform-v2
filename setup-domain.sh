#!/bin/bash

# Скрипт для настройки домена ykz.tw1.ru

echo "=== Настройка домена ykz.tw1.ru ==="

# 1. Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "Создаю файл .env из примера..."
    cp .env.example .env 2>/dev/null || echo "Файл .env.example не найден, создайте .env вручную"
    echo "⚠️  ВАЖНО: Отредактируйте .env и укажите правильные значения!"
    echo "   Особенно NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru"
fi

# 2. Создаем директорию для SSL (на будущее)
mkdir -p ssl

# 3. Обновляем переменные окружения
if grep -q "NEXT_PUBLIC_APP_URL" .env 2>/dev/null; then
    echo "Обновляю NEXT_PUBLIC_APP_URL в .env..."
    sed -i.bak 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru|' .env
else
    echo "NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru" >> .env
fi

# 4. Проверяем DNS (просто ping)
echo ""
echo "Проверяю DNS запись для ykz.tw1.ru..."
if ping -c 1 ykz.tw1.ru &> /dev/null; then
    echo "✅ DNS запись найдена"
else
    echo "⚠️  DNS запись не найдена или домен не разрешается"
    echo "   Убедитесь, что A-запись для ykz.tw1.ru указывает на IP сервера"
fi

# 5. Проверяем порты
echo ""
echo "Проверяю открытость портов 80 и 443..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":80 "; then
        echo "✅ Порт 80 открыт"
    else
        echo "⚠️  Порт 80 не открыт"
    fi
    if netstat -tuln | grep -q ":443 "; then
        echo "✅ Порт 443 открыт"
    else
        echo "ℹ️  Порт 443 не открыт (будет нужен для SSL)"
    fi
fi

# 6. Перезапускаем сервисы
echo ""
read -p "Перезапустить Docker контейнеры? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Останавливаю контейнеры..."
    docker-compose -f docker-compose.prod.yml down
    
    echo "Запускаю контейнеры..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "Ожидаю запуск сервисов..."
    sleep 10
    
    echo ""
    echo "Проверяю доступность..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200"; then
        echo "✅ Сервисы запущены успешно"
    else
        echo "⚠️  Сервисы могут быть еще не готовы, подождите немного"
    fi
fi

echo ""
echo "=== Настройка завершена ==="
echo ""
echo "Следующие шаги:"
echo "1. Убедитесь, что DNS A-запись для ykz.tw1.ru указывает на IP этого сервера"
echo "2. Откройте в браузере: http://ykz.tw1.ru"
echo "3. Для настройки SSL запустите: ./setup-ssl.sh"
echo ""

