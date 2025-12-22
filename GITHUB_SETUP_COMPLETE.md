# Полная настройка GitHub и автоматического деплоя

## Шаг 1: Создание Personal Access Token (PAT) на GitHub

GitHub больше не поддерживает пароли для Git операций. Нужен токен:

1. Перейдите на https://github.com/settings/tokens
2. Нажмите "Generate new token" → "Generate new token (classic)"
3. Название: `Corporate Learning Platform Deploy`
4. Выберите срок действия (рекомендую "No expiration" или 90 дней)
5. Отметьте следующие права (scopes):
   - ✅ `repo` (полный доступ к репозиториям)
   - ✅ `workflow` (для GitHub Actions)
6. Нажмите "Generate token"
7. **ВАЖНО:** Скопируйте токен сразу - он показывается только один раз!

## Шаг 2: Создание репозитория на GitHub

1. Перейдите на https://github.com/new
2. Repository name: `corporate-learning-platform-v2`
3. Description: `Корпоративная платформа обучения`
4. Выберите Public или Private
5. **НЕ** отмечайте "Add a README file" (код уже есть)
6. Нажмите "Create repository"

## Шаг 3: Настройка локального репозитория

Выполните в PowerShell:

```powershell
cd C:\corporate-learning-platform\corporate-learning-platform-v2

# Настройка git (если еще не сделано)
git config user.email "omashi001@gmail.com"
git config user.name "omashi001"

# Добавление remote (замените YOUR_TOKEN на токен из шага 1)
git remote remove origin
git remote add origin https://omashi001:YOUR_TOKEN@github.com/omashi001/corporate-learning-platform-v2.git

# Отправка кода
git push -u origin main
```

## Шаг 4: Настройка GitHub Secrets для автоматического деплоя

1. Перейдите в ваш репозиторий: https://github.com/omashi001/corporate-learning-platform-v2
2. Settings → Secrets and variables → Actions → New repository secret

Добавьте 3 секрета:

### SSH_HOST
```
212.113.123.94
```

### SSH_USER
```
root
```

### SSH_PRIVATE_KEY
Для получения приватного ключа выполните на сервере:

```bash
# Подключитесь к серверу
ssh root@212.113.123.94

# Создайте SSH ключ для деплоя (если еще нет)
ssh-keygen -t rsa -b 4096 -C "deploy@github" -f ~/.ssh/id_rsa_deploy -N ""

# Добавьте публичный ключ в authorized_keys
cat ~/.ssh/id_rsa_deploy.pub >> ~/.ssh/authorized_keys

# Скопируйте ПРИВАТНЫЙ ключ (он нужен для GitHub Secrets)
cat ~/.ssh/id_rsa_deploy
```

Скопируйте весь вывод команды `cat ~/.ssh/id_rsa_deploy` (начинается с `-----BEGIN OPENSSH PRIVATE KEY-----` и заканчивается `-----END OPENSSH PRIVATE KEY-----`) и вставьте в секрет `SSH_PRIVATE_KEY` в GitHub.

## Шаг 5: Настройка сервера

Выполните на сервере:

```bash
cd /root/corporate-learning-platform-v2

# Настройка git remote
git remote set-url origin https://github.com/omashi001/corporate-learning-platform-v2.git

# Настройка для автоматического pull
git config --global credential.helper store
```

## Как это работает

1. Вы делаете изменения локально
2. Выполняете:
   ```bash
   git add .
   git commit -m "Описание изменений"
   git push origin main
   ```
3. GitHub Actions автоматически:
   - Подключается к серверу по SSH
   - Обновляет код (`git pull`)
   - Пересобирает Docker контейнер
   - Перезапускает приложение

## Проверка работы

После настройки:
1. Сделайте небольшое изменение в коде
2. Закоммитьте и запушьте
3. Перейдите в GitHub → Actions
4. Увидите запущенный workflow "Deploy to Server"
5. После успешного выполнения изменения будут на сервере

## Важные замечания

- ✅ Не коммитьте файлы с паролями (они в .gitignore)
- ✅ Все изменения автоматически деплоятся при push в main
- ✅ Проверяйте логи деплоя в GitHub Actions
- ✅ При проблемах с деплоем проверьте Secrets в GitHub

