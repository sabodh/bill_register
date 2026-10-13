.PHONY: db-up db-down backend-setup migrate seed test run-backend run-frontend setup prepare reset dev

prepare:
	bash scripts/hms-prepare.sh

reset:
	bash scripts/hms-reset.sh

dev:
	bash scripts/hms-dev.sh

db-up:
	docker compose up -d db

db-down:
	docker compose down

backend-setup:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements/dev.txt
	test -f backend/.env || cp backend/.env.example backend/.env

migrate:
	cd backend && . .venv/bin/activate && python manage.py migrate

seed:
	cd backend && . .venv/bin/activate && python manage.py seed_demo

test:
	cd backend && . .venv/bin/activate && pytest -q

run-backend:
	cd backend && . .venv/bin/activate && python manage.py runserver 8001

run-frontend:
	cd frontend && npm run dev

# Start Postgres, install deps, migrate, and seed demo data
setup: db-up backend-setup
	@echo "Waiting for PostgreSQL..."
	@sleep 3
	$(MAKE) migrate seed
	@echo "Done. Run: make run-backend  and  make run-frontend"
