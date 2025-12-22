# 🚀 НАЧНИТЕ ЗДЕСЬ: Настройка GitHub и автоматического деплоя

## 📋 Краткая инструкция (5 шагов)

### 1️⃣ Создайте Personal Access Token
- Перейдите: https://github.com/settings/tokens
- Generate new token (classic)
- Права: `repo` + `workflow`
- Скопируйте токен

### 2️⃣ Создайте репозиторий на GitHub
- https://github.com/new
- Название: `corporate-learning-platform-v2`
- НЕ добавляйте README

### 3️⃣ Отправьте код в GitHub
```powershell
cd C:\corporate-learning-platform\corporate-learning-platform-v2
.\setup-github-with-token.ps1 -GitHubToken "ВАШ_ТОКЕН_ЗДЕСЬ"
```

### 4️⃣ Настройте GitHub Secrets
В репозитории: Settings → Secrets → Actions

Добавьте:
- `SSH_HOST` = `212.113.123.94`
- `SSH_USER` = `root`
- `SSH_PRIVATE_KEY` = (получите на сервере командой `cat ~/.ssh/id_rsa_deploy`)

### 5️⃣ Готово!
Теперь при каждом `git push` изменения автоматически деплоятся!

---

📖 **Подробная инструкция:** [FINAL_SETUP_INSTRUCTIONS.md](./FINAL_SETUP_INSTRUCTIONS.md)

