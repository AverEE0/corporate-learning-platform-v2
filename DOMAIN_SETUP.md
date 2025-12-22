# Настройка домена ykz.tw1.ru

## 1. Обновление переменных окружения

Создайте файл `.env` в корне проекта с содержимым:

```env
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning
JWT_SECRET=your_super_secret_jwt_key
NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru
NODE_ENV=production
```

## 2. Настройка DNS

Убедитесь, что DNS записи для домена ykz.tw1.ru указывают на IP вашего сервера:
- A запись: `ykz.tw1.ru` → IP сервера
- A запись (опционально): `www.ykz.tw1.ru` → IP сервера

## 3. Установка SSL сертификата (Let's Encrypt)

На сервере выполните:

```bash
# Установите certbot (если еще не установлен)
sudo apt update
sudo apt install -y certbot

# Получите сертификат
sudo certbot certonly --standalone -d ykz.tw1.ru -d www.ykz.tw1.ru

# Сертификаты будут сохранены в:
# /etc/letsencrypt/live/ykz.tw1.ru/fullchain.pem
# /etc/letsencrypt/live/ykz.tw1.ru/privkey.pem
```

## 4. Настройка Nginx с SSL

Создайте директорию для SSL сертификатов в проекте:

```bash
mkdir -p ssl
```

Скопируйте сертификаты (или создайте симлинки):

```bash
# В production лучше использовать bind mount к /etc/letsencrypt
# или копировать сертификаты в ssl директорию проекта
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/privkey.pem ./ssl/
sudo chmod 644 ./ssl/fullchain.pem
sudo chmod 600 ./ssl/privkey.pem
```

## 5. Обновление docker-compose.prod.yml

Убедитесь, что порты 80 и 443 открыты в docker-compose.prod.yml:

```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
```

## 5.1. Переключение на SSL конфигурацию

После настройки SSL сертификатов, замените `nginx.conf` на `nginx-ssl.conf`:

```bash
# В docker-compose.prod.yml измените:
volumes:
  - ./nginx-ssl.conf:/etc/nginx/nginx.conf:ro
```

Или временно используйте обычный nginx.conf для HTTP, затем переключитесь на SSL версию.

## 6. Автообновление сертификатов

Добавьте в crontab для автоматического обновления:

```bash
sudo crontab -e
```

Добавьте строку:

```
0 0 1 * * certbot renew --quiet && docker-compose -f /path/to/project/docker-compose.prod.yml restart nginx
```

## 7. Перезапуск сервисов

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 8. Проверка

Проверьте доступность:

```bash
# HTTP должен редиректить на HTTPS
curl -I http://ykz.tw1.ru

# HTTPS должен работать
curl -I https://ykz.tw1.ru

# Health check
curl https://ykz.tw1.ru/api/health
```

## Примечания

- Убедитесь, что порты 80 и 443 открыты в firewall
- Cookies настроены для работы с доменом (уже настроено в коде)
- Все внутренние ссылки будут использовать NEXT_PUBLIC_APP_URL

