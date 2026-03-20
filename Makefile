# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

# Install all dependencies (backend + frontend)
.PHONY: setup
setup: backend-deps frontend-deps

# Run both backend and frontend locally (requires postgres)
.PHONY: dev
dev:
	@echo "Starting backend..."
	@make backend-dev &
	@echo "Starting frontend..."
	@make frontend-dev

# Run lint for both backend and frontend
.PHONY: lint
lint: backend-lint frontend-lint

# =============================================================================
# BACKEND COMMANDS
# =============================================================================

.PHONY: backend-deps
backend-deps:
	cd backend && go mod tidy && go install github.com/swaggo/swag/cmd/swag@latest && go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

.PHONY: backend-generate
backend-generate: backend-sqlc backend-docs

.PHONY: backend-sqlc
backend-sqlc:
	cd backend && sqlc generate

.PHONY: backend-docs
backend-docs:
	cd backend && swag init -g cmd/server/main.go -o docs

.PHONY: backend-dev
backend-dev:
	cd backend && go run ./cmd/server/

.PHONY: backend-lint
backend-lint:
	cd backend && golangci-lint run ./...

.PHONY: backend-build
backend-build:
	cd backend && go build -o bin/server ./cmd/server/

.PHONY: backend-test
backend-test:
	cd backend && go test ./...

# =============================================================================
# FRONTEND COMMANDS
# =============================================================================

.PHONY: frontend-deps
frontend-deps:
	cd frontend && npm install && npm install openapi-fetch openapi-typescript

.PHONY: frontend-dev
frontend-dev:
	cd frontend && npm run dev

.PHONY: frontend-build
frontend-build:
	cd frontend && npm run build

.PHONY: frontend-lint
frontend-lint:
	cd frontend && npm run lint

# =============================================================================
# OPENAPI SYNC
# =============================================================================

.PHONY: sync-openapi
sync-openapi:
	cp backend/docs/swagger.json frontend/src/lib/openapi.json
	cd frontend && npx openapi-typescript src/lib/openapi.json --output src/lib/openapi.ts

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

.PHONY: db-start
db-start:
	docker compose up -d postgres
	@echo "Waiting for postgres to be ready..."
	@sleep 3

.PHONY: db-stop
db-stop:
	docker compose stop postgres

.PHONY: db-reset
db-reset:
	docker compose down -v postgres
	docker compose up -d postgres
	@echo "Database reset complete"

.PHONY: db-migrate
db-migrate:
	@if command -v migrate &> /dev/null; then \
		cd backend && migrate -path sql -database "$$DATABASE_URL" up; \
	else \
		echo "migrate CLI not installed. Using sqlc to regenerate..."; \
		make backend-sqlc; \
	fi

.PHONY: db-console
db-console:
	docker compose exec postgres psql -U $${POSTGRES_USER:-app} -d $${POSTGRES_DB:-appdb}

# =============================================================================
# DOCKER COMPOSE
# =============================================================================

.PHONY: dc-up
dc-up:
	docker compose up -d

.PHONY: dc-down
dc-down:
	docker compose down

.PHONY: dc-down-v
dc-down-v:
	docker compose down -v

.PHONY: dc-restart
dc-restart: dc-down dc-up

.PHONY: dc-rebuild
dc-rebuild:
	docker compose up -d --build

.PHONY: dc-logs
dc-logs:
	docker compose logs -f

.PHONY: dc-logs-backend
dc-logs-backend:
	docker compose logs -f backend

.PHONY: dc-logs-frontend
dc-logs-frontend:
	docker compose logs -f frontend

.PHONY: dc-logs-postgres
dc-logs-postgres:
	docker compose logs -f postgres

# =============================================================================
# GENERATE ALL
# =============================================================================

.PHONY: generate
generate: backend-generate sync-openapi

# =============================================================================
# CLEANUP
# =============================================================================

.PHONY: clean
clean:
	cd backend && go clean
	cd frontend && rm -rf .next
	docker compose down --remove-orphans

.PHONY: clean-all
clean-all: clean
	docker compose down -v
	docker system prune -f

# =============================================================================
# K3D (Local Kubernetes)
# =============================================================================

.PHONY: k3d-create
k3d-create:
	@if ! command -v k3d &> /dev/null; then \
		echo "k3d not found. Install: brew install k3d"; \
		exit 1; \
	fi
	k3d cluster create app --servers 1 --agents 2 --port "80:80@loadbalancer" --port "443:443@loadbalancer" --k3s-arg "--disable=traefik@server:0"

.PHONY: k3d-delete
k3d-delete:
	@if command -v k3d &> /dev/null; then \
		k3d cluster delete app; \
	fi

.PHONY: generate-config
generate-config:
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Run 'cp .env.example .env' and update it."; \
		exit 1; \
	fi
	@echo "Generating config from .env..."
	@source .env && \
		export GITHUB_OWNER && \
		export GITHUB_REPO && \
		export INGRESS_HOST && \
		export POSTGRES_USER && \
		export POSTGRES_PASSWORD && \
		export POSTGRES_DB && \
		sed "s|OWNER|$$GITHUB_OWNER|g; s|REPO|$$GITHUB_REPO|g; s|app.local|$$INGRESS_HOST|g" k3s/argocd/application.yaml > /tmp/argocd-app.yaml && \
		sed "s|OWNER|$$GITHUB_OWNER|g" k3s/apps/backend/deployment.yaml > /tmp/backend-deployment.yaml && \
		sed "s|OWNER|$$GITHUB_OWNER|g" k3s/apps/frontend/deployment.yaml > /tmp/frontend-deployment.yaml && \
		sed "s|app.local|$$INGRESS_HOST|g" k3s/ingress/ingress.yaml > /tmp/ingress.yaml && \
		printf "apiVersion: v1\nkind: Secret\nmetadata:\n  name: postgres-secret\n  namespace: app\ntype: Opaque\ndata:\n  POSTGRES_USER: %s\n  POSTGRES_PASSWORD: %s\n  POSTGRES_DB: %s\n" "$$(echo -n $$POSTGRES_USER | base64)" "$$(echo -n $$POSTGRES_PASSWORD | base64)" "$$(echo -n $$POSTGRES_DB | base64)" > /tmp/postgres-secret.yaml && \
		echo "Config generated successfully."

.PHONY: k3d-deploy
k3d-deploy: generate-config
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Run 'cp .env.example .env' and update it."; \
		exit 1; \
	fi
	@source .env && \
		kubectl apply -f k3s/base/namespace.yaml && \
		kubectl apply -f /tmp/postgres-secret.yaml && \
		kubectl apply -f k3s/apps/postgres/ && \
		kubectl rollout status statefulset/postgres -n app --timeout=120s 2>/dev/null || echo "Postgres may already be running" && \
		kubectl apply -f /tmp/backend-deployment.yaml && \
		kubectl apply -f /tmp/frontend-deployment.yaml && \
		kubectl apply -f /tmp/ingress.yaml && \
		kubectl apply -f /tmp/argocd-app.yaml && \
		echo "Deploy complete!"

.PHONY: k3d-status
k3d-status:
	@echo "=== Pods ===" && kubectl get pods -n app || echo "Namespace or pods not found"
	@echo ""
	@echo "=== Services ===" && kubectl get svc -n app || echo "No services found"
	@echo ""
	@echo "=== Ingress ===" && kubectl get ingress -n app || echo "No ingress found"

.PHONY: k3d-logs-backend
k3d-logs-backend:
	kubectl logs -f -l app=backend -n app

.PHONY: k3d-logs-frontend
k3d-logs-frontend:
	kubectl logs -f -l app=frontend -n app

.PHONY: k3d-logs-postgres
k3d-logs-postgres:
	kubectl logs -f -l app=postgres -n app

.PHONY: k3d-delete-resources
k3d-delete-resources:
	kubectl delete -f k3s/ingress/ || true
	kubectl delete -f k3s/apps/ || true
	kubectl delete -f k3s/base/ || true

.PHONY: k3d-full-clean
k3d-full-clean: k3d-delete-resources k3d-delete
