# Скрипт для настройки GitHub репозитория с Personal Access Token

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "corporate-learning-platform-v2"
)

$ErrorActionPreference = "Stop"

Write-Host "Настройка GitHub репозитория с токеном..." -ForegroundColor Cyan

$baseDir = "C:\corporate-learning-platform\corporate-learning-platform-v2"
Set-Location $baseDir

# Настройка git пользователя
Write-Host "Настройка git пользователя..." -ForegroundColor Yellow
git config user.email "omashi001@gmail.com"
git config user.name "omashi001"

# Проверяем, инициализирован ли git
if (-not (Test-Path ".git")) {
    Write-Host "Инициализация git репозитория..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Настройка remote
Write-Host "Настройка GitHub remote..." -ForegroundColor Yellow
git remote remove origin -ErrorAction SilentlyContinue
$repoUrl = "https://omashi001:${GitHubToken}@github.com/omashi001/${RepoName}.git"
git remote add origin $repoUrl

Write-Host "Remote настроен: https://github.com/omashi001/${RepoName}.git" -ForegroundColor Green

# Добавляем все файлы
Write-Host "Добавление файлов..." -ForegroundColor Yellow
git add .

# Проверяем, есть ли изменения для коммита
$status = git status --porcelain
if ($status) {
    Write-Host "Создание коммита..." -ForegroundColor Yellow
    git commit -m "Initial commit: Corporate Learning Platform with course editing and video support"
} else {
    Write-Host "Нет изменений для коммита" -ForegroundColor Yellow
}

# Пушим в GitHub
Write-Host "Отправка в GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main --force
    Write-Host "✓ Код успешно отправлен в GitHub!" -ForegroundColor Green
} catch {
    Write-Warning "Возможна ошибка при отправке. Проверьте токен и права доступа."
}

Write-Host ""
Write-Host "✓ Локальный репозиторий настроен!" -ForegroundColor Green
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Создайте репозиторий на GitHub: https://github.com/new" -ForegroundColor Yellow
Write-Host "   Название: $RepoName" -ForegroundColor Yellow
Write-Host "2. Настройте GitHub Secrets (см. GITHUB_SETUP_COMPLETE.md)" -ForegroundColor Yellow
Write-Host "3. После этого каждый push будет автоматически деплоиться!" -ForegroundColor Yellow

