# Настройка домена ykz.tw1.ru - Итоговая инструкция

## ✅ Что уже настроено:

1. ✅ **nginx.conf** - настроен для работы с доменом `ykz.tw1.ru`
2. ✅ **next.config.mjs** - добавлен домен в список разрешенных для изображений
3. ✅ **.env.example** - обновлен с правильным URL

## 🚀 Быстрый старт:

### На сервере (Linux):

```bash
# 1. Перейдите в директорию проекта
cd /path/to/corporate-learning-platform-v2

# 2. Создайте .env файл (скопируйте из .env.example и заполните)
cp .env.example .env
nano .env  # Укажите правильные значения, особенно DATABASE_URL и JWT_SECRET

# 3. Убедитесь, что NEXT_PUBLIC_APP_URL указан правильно
# Для HTTP (временно): NEXT_PUBLIC_APP_URL=http://ykz.tw1.ru
# Для HTTPS (после SSL): NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru

# 4. Запустите скрипт настройки (если на Linux)
chmod +x setup-domain.sh
./setup-domain.sh

# Или вручную запустите Docker:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Проверка работы:

```bash
# Проверьте доступность
curl http://ykz.tw1.ru/api/health

# Должно вернуть: healthy
```

## 🔒 Настройка SSL (HTTPS):

После того, как сайт работает по HTTP, настройте SSL:

```bash
# Запустите скрипт настройки SSL (на Linux)
chmod +x setup-ssl.sh
./setup-ssl.sh
```

Или вручную:

```bash
# 1. Установите certbot
sudo apt update
sudo apt install -y certbot

# 2. Остановите nginx временно
docker-compose -f docker-compose.prod.yml stop nginx

# 3. Получите сертификат (укажите ваш email)
sudo certbot certonly --standalone -d ykz.tw1.ru -d www.ykz.tw1.ru

# 4. Скопируйте сертификаты
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/privkey.pem ssl/
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem

# 5. Замените nginx.conf на SSL версию
cp nginx.conf nginx-http-backup.conf
cp nginx-ssl.conf nginx.conf

# 6. Обновите .env для HTTPS
sed -i 's|NEXT_PUBLIC_APP_URL=http://|NEXT_PUBLIC_APP_URL=https://|' .env

# 7. Перезапустите nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

## 📋 Чеклист перед запуском:

- [ ] DNS A-запись для `ykz.tw1.ru` указывает на IP сервера
- [ ] Порт 80 открыт в firewall: `sudo ufw allow 80/tcp`
- [ ] Порт 443 открыт в firewall (для SSL): `sudo ufw allow 443/tcp`
- [ ] Файл `.env` создан и заполнен
- [ ] `DATABASE_URL` указан правильно
- [ ] `JWT_SECRET` установлен (сильный случайный ключ)
- [ ] `NEXT_PUBLIC_APP_URL` указан правильно

## 🔍 Проверка DNS:

```bash
# Проверьте, что DNS резолвится правильно
dig ykz.tw1.ru
nslookup ykz.tw1.ru
ping ykz.tw1.ru
```

## 🛠️ Решение проблем:

### Проблема: "502 Bad Gateway"
```bash
# Проверьте, что приложение запущено
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app
```

### Проблема: "DNS не резолвится"
- Убедитесь, что A-запись настроена правильно в панели управления DNS
- Подождите 5-10 минут для распространения DNS

### Проблема: "Порт 80 занят"
```bash
# Проверьте, что использует порт 80
sudo netstat -tulpn | grep :80
sudo lsof -i :80

# Остановите конфликтующий сервис или измените порт в docker-compose.prod.yml
```

### Проблема: Cookies не работают
- Убедитесь, что `NEXT_PUBLIC_APP_URL` указан правильно в `.env`
- После изменения `.env` перезапустите контейнеры: `docker-compose restart app`

## 📝 Важные файлы:

- `nginx.conf` - конфигурация Nginx для HTTP
- `nginx-ssl.conf` - конфигурация Nginx для HTTPS (используйте после настройки SSL)
- `.env` - переменные окружения (создайте из `.env.example`)
- `docker-compose.prod.yml` - конфигурация Docker Compose

## 🔄 Обновление после изменений:

После любых изменений в конфигурации:

```bash
# Пересоберите и перезапустите
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

**Готово!** После выполнения всех шагов ваш сайт будет доступен по адресу `http://ykz.tw1.ru` (или `https://ykz.tw1.ru` после настройки SSL).

