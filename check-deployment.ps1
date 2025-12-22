# Скрипт для проверки статуса деплоя и диагностики проблем

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 ПРОВЕРКА СТАТУСА ДЕПЛОЯ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Проверка последних коммитов
Write-Host "📝 Последние коммиты:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Проверка статуса GitHub Actions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 GitHub Actions" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Откройте в браузере:" -ForegroundColor Yellow
Write-Host "https://github.com/AverEE0/corporate-learning-platform-v2/actions" -ForegroundColor Green
Write-Host ""
Write-Host "Проверьте:" -ForegroundColor Yellow
Write-Host "  1. Есть ли запущенные workflow (желтый кружок)" -ForegroundColor White
Write-Host "  2. Есть ли ошибки (красный крестик)" -ForegroundColor White
Write-Host "  3. Нажмите на последний workflow и посмотрите логи" -ForegroundColor White
Write-Host ""

# Инструкции по диагностике
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔧 ДИАГНОСТИКА ПРОБЛЕМ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Если деплой не работает:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Проверьте GitHub Actions логи:" -ForegroundColor White
Write-Host "   - Откройте: https://github.com/AverEE0/corporate-learning-platform-v2/actions" -ForegroundColor Gray
Write-Host "   - Найдите последний failed workflow" -ForegroundColor Gray
Write-Host "   - Посмотрите на каком шаге ошибка" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Возможные проблемы:" -ForegroundColor White
Write-Host "   ❌ Ошибка сборки Docker (build failed)" -ForegroundColor Red
Write-Host "      → Проверьте Dockerfile и зависимости" -ForegroundColor Gray
Write-Host ""
Write-Host "   ❌ Ошибка Git (exit code 128)" -ForegroundColor Red
Write-Host "      → Проблема с доступом к репозиторию" -ForegroundColor Gray
Write-Host ""
Write-Host "   ❌ Ошибка SSH подключения" -ForegroundColor Red
Write-Host "      → Проверьте SSH ключ в GitHub Secrets" -ForegroundColor Gray
Write-Host ""
Write-Host "   ❌ Ошибка на сервере (exit code 1)" -ForegroundColor Red
Write-Host "      → Проверьте логи на сервере" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Ручной деплой на сервер:" -ForegroundColor White
Write-Host "   Запустите: .\manual-deploy.ps1" -ForegroundColor Green
Write-Host ""

Write-Host "4. Проверка на сервере:" -ForegroundColor White
Write-Host "   SSH на сервер и выполните:" -ForegroundColor Gray
Write-Host "   cd /root/corporate-learning-platform-v2" -ForegroundColor Gray
Write-Host "   git pull" -ForegroundColor Gray
Write-Host "   docker compose logs app" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

