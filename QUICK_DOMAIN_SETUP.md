# Быстрая настройка домена ykz.tw1.ru

## Шаг 1: Настройка DNS

Убедитесь, что DNS A-запись для `ykz.tw1.ru` указывает на IP вашего сервера:

```
ykz.tw1.ru    A    YOUR_SERVER_IP
www.ykz.tw1.ru A   YOUR_SERVER_IP  (опционально)
```

## Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning
JWT_SECRET=your_super_secret_jwt_key_change_this
NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru
NODE_ENV=production
```

## Шаг 3: Запуск через HTTP (для начала)

```bash
# Запустите скрипт настройки
./setup-domain.sh

# Или вручную:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Шаг 4: Проверка работы

```bash
# Проверьте доступность
curl http://ykz.tw1.ru/api/health

# Должен вернуть: healthy
```

## Шаг 5: Настройка SSL (HTTPS)

После того, как сайт работает по HTTP:

```bash
# Запустите скрипт настройки SSL
./setup-ssl.sh
```

Или вручную:

```bash
# 1. Остановите nginx
docker-compose -f docker-compose.prod.yml stop nginx

# 2. Получите сертификат
sudo certbot certonly --standalone -d ykz.tw1.ru -d www.ykz.tw1.ru

# 3. Скопируйте сертификаты
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/ykz.tw1.ru/privkey.pem ssl/
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem

# 4. Замените nginx.conf на nginx-ssl.conf
cp nginx.conf nginx-http-backup.conf
cp nginx-ssl.conf nginx.conf

# 5. Запустите nginx снова
docker-compose -f docker-compose.prod.yml up -d nginx
```

## Важные моменты

1. **Firewall**: Убедитесь, что порты 80 и 443 открыты:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

2. **Автообновление SSL**: Настройте cron для автообновления сертификатов:
   ```bash
   sudo crontab -e
   # Добавьте:
   0 0 1 * * certbot renew --quiet && cd /path/to/project && docker-compose -f docker-compose.prod.yml restart nginx
   ```

3. **Проверка после настройки**:
   - HTTP должен редиректить на HTTPS: `curl -I http://ykz.tw1.ru`
   - HTTPS должен работать: `curl -I https://ykz.tw1.ru`

## Решение проблем

### DNS не резолвится
```bash
# Проверьте DNS
dig ykz.tw1.ru
nslookup ykz.tw1.ru
```

### Порт занят
```bash
# Проверьте, что слушает порты
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Nginx не запускается
```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs nginx

# Проверьте конфигурацию
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

