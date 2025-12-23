# Диагностика: Почему изменения не применяются

## Быстрая проверка

1. **Проверьте GitHub Actions:**
   - Откройте: https://github.com/AverEE0/corporate-learning-platform-v2/actions
   - Найдите последний workflow
   - Проверьте статус:
     - ✅ Зеленая галочка = деплой успешен
     - ❌ Красный крестик = деплой упал с ошибкой
     - ⏳ Желтый кружок = деплой в процессе

2. **Если деплой упал:**
   - Нажмите на workflow
   - Нажмите на шаг "Deploy to server"
   - Прокрутите вниз и найдите ошибку
   - Скопируйте текст ошибки

## Возможные причины

### 1. Деплой не завершился
**Симптомы:** В GitHub Actions виден красный крестик или деплой завис

**Решение:**
- Проверьте логи в GitHub Actions
- Если деплой завис - отмените его и запустите заново
- Проверьте SSH подключение к серверу

### 2. Контейнер не перезапустился
**Симптомы:** Деплой успешен, но изменения не видны

**Решение (выполните на сервере):**
```bash
cd /root/corporate-learning-platform-v2
docker compose ps
docker compose logs app --tail=50
docker compose restart app
```

### 3. Браузер кеширует старые файлы
**Симптомы:** В консоли браузера виден старый файл `page-d5f44ff9a7161f69.js`

**Решение:**
- Откройте сайт в режиме инкогнито (Ctrl+Shift+N)
- Или очистите кеш: Ctrl+Shift+Delete → выберите "Кешированные изображения и файлы"
- Или жесткая перезагрузка: Ctrl+F5

### 4. Next.js кеширует на сервере
**Симптомы:** Деплой успешен, но новый код не загружается

**Решение (выполните на сервере):**
```bash
cd /root/corporate-learning-platform-v2
rm -rf .next node_modules/.cache
docker compose down app
docker compose build --no-cache app
docker compose up -d --force-recreate app
docker compose restart app
```

### 5. Код не дошел до сервера
**Симптомы:** На сервере старый код

**Решение (выполните на сервере):**
```bash
cd /root/corporate-learning-platform-v2
git status
git pull origin main
git log --oneline -5
```

## Полное решение (если ничего не помогает)

Выполните на сервере все команды по порядку:

```bash
# 1. Перейти в директорию проекта
cd /root/corporate-learning-platform-v2

# 2. Получить последний код
git pull origin main

# 3. Очистить весь кеш
rm -rf .next node_modules/.cache

# 4. Остановить и удалить контейнер
docker compose down app
docker compose rm -f app

# 5. Пересобрать без кеша
docker compose build --no-cache app

# 6. Запустить с принудительным пересозданием
docker compose up -d --force-recreate app

# 7. Перезапустить
docker compose restart app

# 8. Проверить статус
docker compose ps
docker compose logs app --tail=30
```

## Проверка результата

После выполнения команд:

1. **Проверьте контейнер:**
   ```bash
   docker compose ps
   ```
   Должен быть статус "Up"

2. **Проверьте логи:**
   ```bash
   docker compose logs app --tail=50
   ```
   Не должно быть ошибок

3. **Проверьте сайт:**
   - Откройте https://ykz.tw1.ru в режиме инкогнито
   - Откройте консоль браузера (F12)
   - Проверьте имя файла `.js` - должно быть новое (не `page-d5f44ff9a7161f69.js`)
   - Проверьте иконку в боковой панели - должна быть `ListChecks` (список с галочками)

## Если проблема сохраняется

1. Проверьте логи GitHub Actions
2. Проверьте логи Docker на сервере
3. Проверьте, что код действительно изменился (git log на сервере)
4. Проверьте, что контейнер использует новый образ (docker images)

