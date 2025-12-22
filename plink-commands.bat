@echo off
REM Скрипт для выполнения команд на удаленном сервере через plink
REM Использование: plink-commands.bat

set SERVER=212.113.123.94
set USER=root
set PASSWORD=wNaqg6r+wRUDV?
set PROJECT_PATH=/путь/к/project

echo Подключение к серверу %SERVER%...

REM Команда 1: Установка зависимостей
echo.
echo [1/5] Установка зависимостей...
plink -ssh %USER%@%SERVER% -pw "%PASSWORD%" "cd %PROJECT_PATH% && npm install"

REM Команда 2: Создание .env.local
echo.
echo [2/5] Создание .env.local...
plink -ssh %USER%@%SERVER% -pw "%PASSWORD%" "cd %PROJECT_PATH% && if [ ! -f .env.local ]; then cp .env.example .env.local; fi"

REM Команда 3: Создание директорий
echo.
echo [3/5] Создание директорий...
plink -ssh %USER%@%SERVER% -pw "%PASSWORD%" "cd %PROJECT_PATH% && mkdir -p uploads logs"

REM Команда 4: Сборка проекта
echo.
echo [4/5] Сборка проекта...
plink -ssh %USER%@%SERVER% -pw "%PASSWORD%" "cd %PROJECT_PATH% && npm run build"

REM Команда 5: Запуск проекта
echo.
echo [5/5] Запуск проекта...
plink -ssh %USER%@%SERVER% -pw "%PASSWORD%" "cd %PROJECT_PATH% && npm start"

echo.
echo Готово!
echo.
echo ВАЖНО: Убедитесь, что:
echo 1. .env.local настроен правильно (DATABASE_URL, JWT_SECRET)
echo 2. Миграции БД выполнены
echo 3. Проект доступен по адресу сервера

pause

