# 🔧 Руководство по диагностике проблем деплоя

## 📋 Быстрая диагностика

### 1. Проверка статуса GitHub Actions

Откройте в браузере:
```
https://github.com/AverEE0/corporate-learning-platform-v2/actions
```

**Что проверить:**
- ✅ Зеленый кружок = деплой успешен
- ⚠️ Желтый кружок = деплой в процессе
- ❌ Красный крестик = деплой провалился

**Если деплой провалился:**
1. Нажмите на последний failed workflow
2. Найдите шаг с ошибкой (обычно "Deploy to server")
3. Разверните шаг и посмотрите логи
4. Найдите строку с "❌ ОШИБКА" или "exit code"

### 2. Типичные ошибки и решения

#### ❌ Exit Code 128 (Git ошибка)
**Причина:** Проблема с доступом к GitHub репозиторию

**Решение:**
```bash
# На сервере выполните:
cd /root/corporate-learning-platform-v2
git remote -v  # Проверьте remote URL
git remote set-url origin https://github.com/AverEE0/corporate-learning-platform-v2.git
git pull origin main
```

#### ❌ Exit Code 1 (Ошибка на сервере)
**Причина:** Ошибка сборки Docker или запуска контейнеров

**Решение:**
```bash
# На сервере выполните:
cd /root/corporate-learning-platform-v2
docker compose logs app  # Посмотрите логи
docker compose ps -a      # Проверьте статус контейнеров
docker compose build --no-cache app  # Пересоберите
```

#### ❌ SSH Connection Failed
**Причина:** Неправильный SSH ключ в GitHub Secrets

**Решение:**
1. Откройте: https://github.com/AverEE0/corporate-learning-platform-v2/settings/secrets/actions
2. Проверьте `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`
3. Убедитесь, что SSH ключ правильный

#### ❌ Docker Build Failed
**Причина:** Ошибка в Dockerfile или зависимостях

**Решение:**
```bash
# На сервере проверьте:
cd /root/corporate-learning-platform-v2
docker compose build --no-cache app 2>&1 | tail -50
```

### 3. Ручной деплой

Если автоматический деплой не работает, используйте ручной:

**Windows (PowerShell):**
```powershell
.\manual-deploy.ps1
```

**Или через SSH вручную:**
```bash
ssh root@212.113.123.94
cd /root/corporate-learning-platform-v2
git pull origin main
docker compose down
docker compose build --no-cache app
docker compose up -d app
docker compose logs app
```

### 4. Проверка на сервере

**Проверка последнего коммита:**
```bash
cd /root/corporate-learning-platform-v2
git log --oneline -5
git status
```

**Проверка контейнеров:**
```bash
docker compose ps
docker compose logs app --tail=50
```

**Проверка доступности:**
```bash
curl http://localhost:3000/health || echo "Приложение не отвечает"
```

### 5. Принудительный перезапуск

Если контейнеры зависли:
```bash
cd /root/corporate-learning-platform-v2
docker compose down
docker compose up -d --force-recreate app
docker compose logs -f app
```

### 6. Полная пересборка

Если ничего не помогает:
```bash
cd /root/corporate-learning-platform-v2
git pull origin main
docker compose down -v  # Удаляет volumes
docker compose build --no-cache app
docker compose up -d app
docker compose logs -f app
```

## 📞 Контакты для помощи

Если проблема не решается:
1. Скопируйте логи из GitHub Actions
2. Скопируйте логи с сервера: `docker compose logs app`
3. Проверьте статус: `docker compose ps`

## 🔍 Полезные команды

**Проверка Git:**
```bash
git remote -v
git status
git log --oneline -10
```

**Проверка Docker:**
```bash
docker --version
docker compose version
docker compose ps
docker compose logs app
```

**Проверка места на диске:**
```bash
df -h
```

**Проверка процессов:**
```bash
ps aux | grep docker
ps aux | grep node
```

