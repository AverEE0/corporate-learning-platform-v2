.PHONY: help build up down restart logs clean deploy init-db backup

help: ## Показать эту справку
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Собрать Docker образы
	docker-compose build --no-cache

up: ## Запустить контейнеры
	docker-compose up -d

down: ## Остановить контейнеры
	docker-compose down

restart: ## Перезапустить контейнеры
	docker-compose restart

logs: ## Показать логи
	docker-compose logs -f app

logs-all: ## Показать все логи
	docker-compose logs -f

ps: ## Показать статус контейнеров
	docker-compose ps

clean: ## Очистить неиспользуемые ресурсы Docker
	docker system prune -f

deploy: ## Полное развертывание
	@echo "🚀 Развертывание приложения..."
	chmod +x deploy.sh
	./deploy.sh

init-db: ## Инициализировать базу данных
	@echo "🗄️  Инициализация базы данных..."
	chmod +x scripts/init-db.sh
	./scripts/init-db.sh

backup: ## Создать резервную копию
	@echo "💾 Создание резервной копии..."
	chmod +x scripts/backup.sh
	./scripts/backup.sh

health: ## Проверить здоровье приложения
	@curl -f http://localhost/api/health || echo "❌ Приложение не отвечает"

stats: ## Показать использование ресурсов
	docker stats

shell: ## Войти в контейнер приложения
	docker-compose exec app sh

