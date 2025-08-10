# PayFast - Makefile
# A comprehensive build system for the PayFast payroll reconciliation application

.PHONY: help build up down restart logs clean test migrate seed api-logs web-logs db-logs audit-logs shell-api shell-web shell-db format lint check

# Default target
help: ## Show this help message
	@echo "PayFast - Payroll Reconciliation System"
	@echo "======================================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
build: ## Build all Docker containers
	docker compose build

up: ## Start all services in detached mode
	docker compose up -d

down: ## Stop and remove all containers
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Show logs from all services
	docker compose logs -f

# Service-specific Commands
api-logs: ## Show API service logs
	docker compose logs -f api

web-logs: ## Show web service logs
	docker compose logs -f web

db-logs: ## Show database service logs
	docker compose logs -f db

audit-logs: ## Show audit-related logs
	docker compose logs api | grep -i audit

# Shell Access
shell-api: ## Open shell in API container
	docker compose exec api bash

shell-web: ## Open shell in web container
	docker compose exec web bash

shell-db: ## Open shell in database container
	docker compose exec db psql -U app -d app

# Database Commands
migrate: ## Run database migrations
	docker compose exec -T api bash -lc "cd /app && alembic upgrade head"

migrate-create: ## Create a new migration (usage: make migrate-create name=migration_name)
	docker compose exec -T api bash -lc "cd /app && alembic revision --autogenerate -m '$(name)'"

seed: ## Seed the database with sample data
	docker compose exec -T api python /app/scripts_seed_enroll.py

db-reset: ## Reset database (drop and recreate)
	docker compose down -v
	docker compose up -d db
	sleep 5
	$(MAKE) migrate
	$(MAKE) seed

# Testing Commands
test: ## Run all tests
	@echo "Running API tests..."
	docker compose exec -T api python -m pytest tests/ -v
	@echo "Running frontend tests..."
	docker compose exec -T web npm test

test-api: ## Run API tests only
	docker compose exec -T api python -m pytest tests/ -v

test-web: ## Run frontend tests only
	docker compose exec -T web npm test

# Code Quality
format: ## Format code (Python and TypeScript)
	@echo "Formatting Python code..."
	docker compose exec -T api black /app --line-length=88
	docker compose exec -T api isort /app
	@echo "Formatting TypeScript code..."
	docker compose exec -T web npm run format

lint: ## Lint code (Python and TypeScript)
	@echo "Linting Python code..."
	docker compose exec -T api flake8 /app
	docker compose exec -T api mypy /app
	@echo "Linting TypeScript code..."
	docker compose exec -T web npm run lint

check: ## Run all code quality checks
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) test

# API Testing
test-upload: ## Test payroll upload API
	curl -X POST "http://localhost:8000/api/tenants/demo-tenant-1/payroll/upload" \
		-H "X-Tenant-ID: demo-tenant-1" \
		-F "file=@sample/payroll.csv"

test-reconcile: ## Test reconciliation API (usage: make test-reconcile batch_id=1)
	curl -X POST "http://localhost:8000/api/tenants/demo-tenant-1/reconcile?payroll_batch_id=$(batch_id)" \
		-H "X-Tenant-ID: demo-tenant-1"

test-audit: ## Test audit log API
	curl -X GET "http://localhost:8000/api/tenants/demo-tenant-1/audit/logs" \
		-H "X-Tenant-ID: demo-tenant-1"

test-audit-summary: ## Test audit summary API
	curl -X GET "http://localhost:8000/api/tenants/demo-tenant-1/audit/logs/summary" \
		-H "X-Tenant-ID: demo-tenant-1"

# Development Utilities
clean: ## Clean up Docker resources
	docker compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean up all Docker resources (including images)
	docker compose down -v --remove-orphans
	docker system prune -af

status: ## Show status of all services
	docker compose ps

health: ## Check health of all services
	@echo "Checking API health..."
	curl -s http://localhost:8000/healthz | jq .
	@echo "Checking frontend accessibility..."
	curl -s http://localhost:5173 > /dev/null && echo "Frontend: OK" || echo "Frontend: ERROR"
	@echo "Checking database connection..."
	docker compose exec -T db pg_isready -U app -d app

# Data Management
export-data: ## Export database data
	docker compose exec -T db pg_dump -U app -d app > backup_$(shell date +%Y%m%d_%H%M%S).sql

import-data: ## Import database data (usage: make import-data file=backup.sql)
	docker compose exec -T db psql -U app -d app < $(file)

# Monitoring
monitor: ## Monitor system resources
	@echo "=== Docker Containers ==="
	docker compose ps
	@echo ""
	@echo "=== System Resources ==="
	docker stats --no-stream
	@echo ""
	@echo "=== Recent API Logs ==="
	docker compose logs --tail=10 api

# Quick Start
dev: ## Quick development setup
	@echo "Setting up development environment..."
	$(MAKE) build
	$(MAKE) up
	@echo "Waiting for services to start..."
	sleep 10
	$(MAKE) migrate
	$(MAKE) seed
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo "Frontend: http://localhost:5173"
	@echo "API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Production-like Commands
prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker compose -f docker-compose.prod.yml down

# Documentation
docs: ## Generate API documentation
	docker compose exec -T api python -c "import uvicorn; from main import app; print('API documentation available at: http://localhost:8000/docs')"

# Troubleshooting
debug: ## Show debug information
	@echo "=== Environment Information ==="
	@echo "Docker version:"
	docker --version
	@echo ""
	@echo "Docker Compose version:"
	docker compose version
	@echo ""
	@echo "=== Container Status ==="
	$(MAKE) status
	@echo ""
	@echo "=== Recent Logs ==="
	docker compose logs --tail=20

# Convenience Commands
api: ## Quick access to API logs
	$(MAKE) api-logs

web: ## Quick access to web logs
	$(MAKE) web-logs

db: ## Quick access to database
	$(MAKE) shell-db

# Development Workflow
workflow: ## Complete development workflow
	@echo "🚀 Starting PayFast development workflow..."
	$(MAKE) dev
	@echo ""
	@echo "📋 Next steps:"
	@echo "1. Open http://localhost:5173 in your browser"
	@echo "2. Upload a payroll file using the sample data"
	@echo "3. Run reconciliation on the uploaded batch"
	@echo "4. Review and approve the reconciliation"
	@echo "5. Check the audit log for all activities"
	@echo ""
	@echo "🔧 Useful commands:"
	@echo "  make logs          - View all logs"
	@echo "  make api-logs      - View API logs only"
	@echo "  make shell-api     - Access API container"
	@echo "  make test-upload   - Test payroll upload"
	@echo "  make test-audit    - Test audit functionality"
