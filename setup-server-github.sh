#!/bin/bash
# Скрипт для настройки сервера для работы с GitHub

echo "Настройка сервера для автоматического деплоя из GitHub..."

cd /root/corporate-learning-platform-v2

# Настройка git remote для GitHub
echo "Настройка git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/omashi001/corporate-learning-platform-v2.git

# Настройка git пользователя
git config user.email "omashi001@gmail.com"
git config user.name "omashi001"

# Создание SSH ключа для GitHub Actions (если еще нет)
if [ ! -f ~/.ssh/id_rsa_deploy ]; then
    echo "Создание SSH ключа для деплоя..."
    ssh-keygen -t rsa -b 4096 -C "deploy@github" -f ~/.ssh/id_rsa_deploy -N ""
    
    # Добавляем публичный ключ в authorized_keys
    cat ~/.ssh/id_rsa_deploy.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    
    echo ""
    echo "✓ SSH ключ создан!"
    echo ""
    echo "Скопируйте ПРИВАТНЫЙ ключ ниже и добавьте в GitHub Secrets → SSH_PRIVATE_KEY:"
    echo "=========================================="
    cat ~/.ssh/id_rsa_deploy
    echo "=========================================="
else
    echo "SSH ключ уже существует. Показываю приватный ключ:"
    echo "=========================================="
    cat ~/.ssh/id_rsa_deploy
    echo "=========================================="
fi

# Создаем скрипт для автоматического деплоя
cat > /root/deploy-from-github.sh << 'DEPLOYSCRIPT'
#!/bin/bash
cd /root/corporate-learning-platform-v2
git fetch origin
git reset --hard origin/main || git reset --hard origin/master
docker compose build app
docker compose up -d app
echo "Deployment completed at $(date)"
DEPLOYSCRIPT

chmod +x /root/deploy-from-github.sh

echo ""
echo "✓ Сервер настроен!"
echo ""
echo "Следующие шаги:"
echo "1. Скопируйте приватный SSH ключ выше"
echo "2. Добавьте его в GitHub Secrets → SSH_PRIVATE_KEY"
echo "3. После этого GitHub Actions будет автоматически деплоить изменения"

