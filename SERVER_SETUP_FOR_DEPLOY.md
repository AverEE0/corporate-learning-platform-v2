# ⚙️ Настройка сервера для автоматического деплоя

## 🎯 Что нужно проверить/настроить на сервере

### 1. Подключитесь к серверу

```bash
ssh root@212.113.123.94
# Пароль: wNaqg6r+wRUDV?
```

### 2. Перейдите в директорию проекта

```bash
cd /root/corporate-learning-platform-v2
```

### 3. Проверьте, установлен ли Git

```bash
git --version
```

Если Git не установлен:
```bash
apt-get update
apt-get install -y git
```

### 4. Настройте Git (если еще не настроен)

```bash
git config --global user.name "Deploy Bot"
git config --global user.email "deploy@corporate-learning-platform"
```

### 5. Проверьте/настройте Git Remote

**Проверьте текущий remote:**
```bash
git remote -v
```

**Если remote не настроен или неправильный, настройте его:**
```bash
# Удалите старый remote (если есть)
git remote remove origin 2>/dev/null || true

# Добавьте правильный remote
git remote add origin https://github.com/AverEE0/corporate-learning-platform-v2.git

# Или обновите существующий
git remote set-url origin https://github.com/AverEE0/corporate-learning-platform-v2.git
```

**Проверьте еще раз:**
```bash
git remote -v
```

Должно показать:
```
origin  https://github.com/AverEE0/corporate-learning-platform-v2.git (fetch)
origin  https://github.com/AverEE0/corporate-learning-platform-v2.git (push)
```

### 6. Проверьте, что можете получить код из GitHub

```bash
# Проверьте подключение к GitHub
git fetch origin

# Если fetch работает, попробуйте pull
git pull origin main
```

**Если возникли проблемы:**
- Убедитесь, что репозиторий публичный (Public)
- Или убедитесь, что на сервере настроен доступ к приватному репозиторию

### 7. Убедитесь, что Docker установлен

```bash
docker --version
docker compose version
```

Если Docker не установлен, смотрите инструкции ниже.

### 8. Проверьте GitHub Secrets (на GitHub, не на сервере)

Убедитесь, что в GitHub настроены следующие Secrets:
- `SSH_HOST` = `212.113.123.94`
- `SSH_USER` = `root`
- `SSH_PRIVATE_KEY` = (приватный SSH ключ)

**Как проверить Secrets:**
1. Откройте: https://github.com/AverEE0/corporate-learning-platform-v2/settings/secrets/actions
2. Убедитесь, что все три секрета настроены

---

## 🚀 Автоматическая настройка (одна команда)

Выполните на сервере:

```bash
cd /root && \
if [ ! -d "corporate-learning-platform-v2" ]; then
  git clone https://github.com/AverEE0/corporate-learning-platform-v2.git
fi && \
cd corporate-learning-platform-v2 && \
git remote set-url origin https://github.com/AverEE0/corporate-learning-platform-v2.git && \
git config --global user.name "Deploy Bot" && \
git config --global user.email "deploy@corporate-learning-platform" && \
echo "✅ Настройка завершена!"
```

---

## ✅ После настройки проверьте

1. **Git remote настроен правильно:**
   ```bash
   cd /root/corporate-learning-platform-v2
   git remote -v
   git fetch origin
   ```

2. **Docker работает:**
   ```bash
   docker compose ps
   ```

3. **GitHub Actions может подключиться:**
   - Сделайте тестовый коммит
   - Откройте: https://github.com/AverEE0/corporate-learning-platform-v2/actions
   - Проверьте, что деплой запустился и успешно выполнился

---

## 🐛 Частые проблемы и решения

### Проблема: "exit code 128" при деплое

**Решение:**
1. Проверьте, что Git установлен: `git --version`
2. Проверьте remote: `git remote -v`
3. Проверьте доступ к GitHub: `git fetch origin`
4. Убедитесь, что репозиторий публичный или настроен доступ

### Проблема: "Permission denied" при SSH

**Решение:**
1. Проверьте GitHub Secrets - правильно ли указан `SSH_PRIVATE_KEY`
2. Убедитесь, что SSH ключ добавлен на сервере в `~/.ssh/authorized_keys`

### Проблема: "docker compose: command not found"

**Решение:**
```bash
# Установите Docker Compose
apt-get update
apt-get install -y docker-compose-plugin
```

---

## 📝 Итоговый чеклист

- [ ] Git установлен на сервере
- [ ] Git remote настроен на `https://github.com/AverEE0/corporate-learning-platform-v2.git`
- [ ] Можно выполнить `git fetch origin` без ошибок
- [ ] Docker и docker compose установлены
- [ ] GitHub Secrets настроены (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)
- [ ] Тестовый деплой через GitHub Actions прошел успешно

---

**После выполнения всех пунктов автоматический деплой должен работать!** 🎉

