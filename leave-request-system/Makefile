# leave-request-system/Makefile
-include .env
export

.PHONY: install dev migrate seed test test-e2e test-e2e-ui db-reset build

# Install all dependencies for frontend and backend
install:
	cd backend && npm install
	cd frontend && npm install

# Start Docker DB + frontend + backend dev servers concurrently
dev:
	docker-compose up -d
	npx --yes concurrently \
		--names "backend,frontend" \
		--prefix-colors "blue,green" \
		"cd backend && DATABASE_URL=$(DATABASE_URL) SESSION_SECRET=$(SESSION_SECRET) npm run dev" \
		"cd frontend && npm run dev"

# Run Flyway migrations via Docker (no local Java needed)
migrate:
	docker run --rm \
		--network host \
		-e FLYWAY_URL=jdbc:postgresql://$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB) \
		-e FLYWAY_USER=$(POSTGRES_USER) \
		-e FLYWAY_PASSWORD=$(POSTGRES_PASSWORD) \
		-v $(PWD)/db/migrations:/flyway/sql \
		flyway/flyway migrate

# Seed is just migrate (V99 is a migration; Flyway skips if already applied)
seed: migrate

# Run all backend unit + integration tests
test:
	docker-compose up -d
	cd backend && \
		DATABASE_URL=$(DATABASE_URL) \
		SESSION_SECRET=$(SESSION_SECRET) \
		npx vitest run

# Run Playwright E2E tests (requires dev servers running)
test-e2e:
	cd frontend && npx playwright test

test-e2e-ui:
	cd frontend && npx playwright test --ui

# Drop and recreate DB, then re-run all migrations
db-reset:
	docker-compose down -v
	docker-compose up -d
	sleep 3
	$(MAKE) migrate

# Build frontend for production
build:
	cd frontend && npm run build
