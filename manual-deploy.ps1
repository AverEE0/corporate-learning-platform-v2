# Скрипт для ручного деплоя на сервер

$ErrorActionPreference = "Stop"

$sshHost = "212.113.123.94"
$sshUser = "root"
$sshPassword = "wNaqg6r+wRUDV?"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 РУЧНОЙ ДЕПЛОЙ НА СЕРВЕР" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Информация:" -ForegroundColor Yellow
Write-Host "   Хост: $sshHost" -ForegroundColor White
Write-Host "   Пользователь: $sshUser" -ForegroundColor White
Write-Host ""

# Проверка наличия plink
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    Write-Host "❌ plink не найден!" -ForegroundColor Red
    Write-Host "   Установите PuTTY или добавьте plink в PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ plink найден" -ForegroundColor Green
Write-Host ""

# Команды для выполнения на сервере
$deployScript = @"
set -e
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 РУЧНОЙ ДЕПЛОЙ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Переход в директорию проекта
cd /root/corporate-learning-platform-v2 || { echo "❌ Директория не найдена"; exit 1; }
echo "✅ Перешли в директорию проекта"
echo ""

# Получение последних изменений
echo "📦 Получение изменений из GitHub..."
if git pull origin main 2>&1; then
    echo "✅ Код обновлен"
elif git pull origin master 2>&1; then
    echo "✅ Код обновлен"
else
    echo "⚠️  Git pull не удался, пробуем fetch + reset..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null
    echo "✅ Код обновлен через reset"
fi
echo ""

# Показываем текущий коммит
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
CURRENT_MESSAGE=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo 'unknown')
echo "📝 Текущий коммит: $CURRENT_COMMIT"
echo "📝 Сообщение: $CURRENT_MESSAGE"
echo ""

# Остановка контейнеров
echo "🛑 Остановка контейнеров..."
docker compose down 2>&1 || true
echo ""

# Сборка контейнеров
echo "🏗️  Сборка Docker контейнеров..."
if docker compose build --no-cache app 2>&1; then
    echo "✅ Сборка завершена"
else
    echo "❌ Ошибка сборки"
    exit 1
fi
echo ""

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
if docker compose up -d app 2>&1; then
    echo "✅ Контейнеры запущены"
else
    echo "❌ Ошибка запуска"
    exit 1
fi
echo ""

# Ожидание и проверка
echo "⏳ Ожидание запуска (5 секунд)..."
sleep 5

echo "📊 Статус контейнеров:"
docker compose ps

echo ""
echo "📋 Последние логи:"
docker compose logs --tail=20 app

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"@

Write-Host "📤 Отправка команд на сервер..." -ForegroundColor Yellow
Write-Host ""

try {
    # Выполняем команды через plink
    $deployScript | & plink -ssh "$sshUser@$sshHost" -pw "$sshPassword" -batch
    
    Write-Host ""
    Write-Host "✅ Деплой выполнен!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Проверьте статус на сервере:" -ForegroundColor Yellow
    Write-Host "   docker compose ps" -ForegroundColor Gray
    Write-Host "   docker compose logs app" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка деплоя: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте подключиться вручную:" -ForegroundColor Yellow
    Write-Host "   plink -ssh $sshUser@$sshHost -pw `"$sshPassword`"" -ForegroundColor Gray
}

