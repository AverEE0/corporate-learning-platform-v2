# 📋 Пошаговая инструкция - Сейчас выполните эти шаги

## ✅ Шаг 1: Создайте репозиторий на GitHub (СДЕЛАЙТЕ ЭТО СЕЙЧАС!)

1. Откройте браузер и перейдите: **https://github.com/new**
2. Заполните форму:
   - **Repository name:** `corporate-learning-platform-v2`
   - **Description:** `Корпоративная платформа обучения` (опционально)
   - **Public** или **Private** (на ваш выбор)
   - **❌ НЕ ОТМЕЧАЙТЕ** "Add a README file" (код уже есть)
   - **❌ НЕ ОТМЕЧАЙТЕ** "Add .gitignore" (уже есть)
   - **❌ НЕ ОТМЕЧАЙТЕ** "Choose a license"
3. Нажмите **"Create repository"**

## ✅ Шаг 2: Отправьте код в GitHub

После создания репозитория выполните в PowerShell:

```powershell
cd C:\corporate-learning-platform\corporate-learning-platform-v2
git push -u origin main
```

## ✅ Шаг 3: Настройте GitHub Secrets

Перейдите в созданный репозиторий: **https://github.com/omashi001/corporate-learning-platform-v2**

Затем: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Добавьте 3 секрета:

#### 1. `SSH_HOST`
```
212.113.123.94
```

#### 2. `SSH_USER`
```
root
```

#### 3. `SSH_PRIVATE_KEY`
Скопируйте этот ключ (весь текст от BEGIN до END):

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

## ✅ Шаг 4: Готово!

После выполнения всех шагов:

1. Сделайте небольшое изменение в коде
2. Выполните:
   ```powershell
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Перейдите в GitHub → Actions
4. Увидите запущенный workflow "Deploy to Server"
5. После успешного выполнения изменения будут на сервере!

## 🎉 Автоматический деплой настроен!

Теперь каждый `git push` в `main` будет автоматически деплоить изменения на сервер.

