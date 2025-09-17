SHELL := /bin/bash

.PHONY: up down seed test lint fmt

up:
	docker compose up --build -d
	@echo "Backend:  http://localhost:4000/health"
	@echo "Frontend: http://localhost:5173"
	@echo "Scrapers: http://localhost:8000/health"

down:
	docker compose down -v

seed:
	docker compose run --rm backend mix ecto.create
	docker compose run --rm backend mix ecto.migrate
	docker compose run --rm backend mix run priv/repo/seeds.exs

test:
	# Backend tests
	docker compose run --rm backend mix test
	# Frontend tests
	docker compose run --rm frontend npm test -- --ci --watchAll=false
	# Scrapers tests
	docker compose run --rm scrapers pytest -q

lint:
	# Backend lint
	docker compose run --rm backend mix credo --strict || true
	# Frontend lint
	docker compose run --rm frontend npm run lint || true
	# Scrapers lint
	docker compose run --rm scrapers ruff check . || true

fmt:
	# Backend format
	docker compose run --rm backend mix format
	# Frontend format
	docker compose run --rm frontend npm run fmt
	# Scrapers format
	docker compose run --rm scrapers black .

