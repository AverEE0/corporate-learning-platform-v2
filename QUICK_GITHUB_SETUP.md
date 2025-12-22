# Быстрая настройка GitHub и автоматического деплоя

## ⚡ Быстрый старт

### 1. Создайте Personal Access Token на GitHub:
- Перейдите: https://github.com/settings/tokens
- Generate new token (classic)
- Права: `repo` и `workflow`
- Скопируйте токен

### 2. Создайте репозиторий на GitHub:
- https://github.com/new
- Название: `corporate-learning-platform-v2`
- НЕ добавляйте README

### 3. Настройте локально (PowerShell):

```powershell
cd C:\corporate-learning-platform\corporate-learning-platform-v2

# Замените YOUR_TOKEN на токен из шага 1
.\setup-github-with-token.ps1 -GitHubToken "YOUR_TOKEN"
```

### 4. Настройте GitHub Secrets:

В репозитории: Settings → Secrets and variables → Actions

Добавьте:
- `SSH_HOST` = `212.113.123.94`
- `SSH_USER` = `root`
- `SSH_PRIVATE_KEY` = (см. инструкцию ниже)

### 5. Получите SSH ключ на сервере:

```bash
ssh root@212.113.123.94

# Создайте ключ
ssh-keygen -t rsa -b 4096 -C "deploy@github" -f ~/.ssh/id_rsa_deploy -N ""

# Добавьте в authorized_keys
cat ~/.ssh/id_rsa_deploy.pub >> ~/.ssh/authorized_keys

# Скопируйте приватный ключ
cat ~/.ssh/id_rsa_deploy
```

Скопируйте весь вывод и вставьте в `SSH_PRIVATE_KEY` в GitHub Secrets.

### 6. Настройте сервер:

```bash
cd /root/corporate-learning-platform-v2
git remote set-url origin https://github.com/omashi001/corporate-learning-platform-v2.git
```

## ✅ Готово!

Теперь при каждом `git push` изменения автоматически деплоятся на сервер!

```powershell
git add .
git commit -m "Описание изменений"
git push origin main
```

Проверяйте деплой в: GitHub → Actions

