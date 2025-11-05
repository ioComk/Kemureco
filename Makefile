.PHONY: help up-dev up-prod down-dev down-prod logs-dev logs-prod clean

help: ## ヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up-dev: ## 開発環境を起動
	docker compose -f docker-compose.dev.yml up -d

up-prod: ## 本番環境を起動（ビルドあり）
	docker compose -f docker-compose.yml up -d --build

down-dev: ## 開発環境を停止
	docker compose -f docker-compose.dev.yml down

down-prod: ## 本番環境を停止
	docker compose -f docker-compose.yml down

logs-dev: ## 開発環境のログを表示
	docker compose -f docker-compose.dev.yml logs -f

logs-prod: ## 本番環境のログを表示
	docker compose -f docker-compose.yml logs -f

clean: ## 全てのコンテナとボリュームを削除
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.yml down -v
