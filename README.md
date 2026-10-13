# Healthcare Management Platform

Modular monolith for hospital and lab operations (Django + React). This foundation includes auth, users/roles, and core masters (branch, patient, doctor, staff).

## Prerequisites

- Python 3.13+ (3.14 works in dev)
- Node.js 20+
- PostgreSQL 15+ (or SQLite for quick local dev)
- VS Code (recommended)

## Quick start (macOS, recommended)

Uses **PostgreSQL via Docker** when Docker is running; otherwise falls back to **SQLite** automatically.

```bash
cd bill_register
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

For PostgreSQL: start [Docker Desktop](https://www.docker.com/products/docker-desktop/), then run the script again.

Then in two terminals:

```bash
make run-backend    # or: cd backend && source .venv/bin/activate && python manage.py runserver 8001
make run-frontend   # or: cd frontend && npm run dev
```

Equivalent Make targets: `make db-up`, `make setup` (db + migrate + seed).

## Backend setup (manual)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env
docker compose up -d db   # from repo root, or use Homebrew Postgres below
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8001
```

API docs: [http://localhost:8001/api/docs/](http://localhost:8001/api/docs/) (backend runs on **8001** so port 8000 can stay free)

Demo login after `seed_demo`: **admin** / **adminpass123**

### Tests and lint (backend)

```bash
cd backend
source .venv/bin/activate
pytest
ruff check .
mypy apps config
```

Tests use SQLite in memory (`config.settings.test`). Local dev uses **PostgreSQL** via `.env` (or SQLite for a zero-setup option).

### PostgreSQL on macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s hms || true
psql postgres -c "ALTER USER hms WITH PASSWORD 'hms_password';"
createdb -O hms hms_dev
```

Or use your own user and set `DB_USER` / `DB_PASSWORD` in `backend/.env`.

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Generate API types

With the backend running:

```bash
npm run generate:api-types
```

### Lint and format

```bash
npm run lint
npm run format
```

## JWT storage (frontend)

Access tokens are kept in memory. Refresh tokens are stored in `localStorage` (`hms_refresh_token`). This is a deliberate trade-off for SPA simplicity; httpOnly cookies can be adopted later.

## VS Code — one-click start / reset

Install recommended extensions from `.vscode/extensions.json` (Python, debugpy, ESLint, Prettier).

### Debug panel (Run and Debug)

| Launch config | What it does |
|---------------|----------------|
| **▶ HMS: Debug Full Stack** | Prepare (venv, migrate) → Django **debugger** on **:8001** + Vite on **:5173** |
| **🔄 HMS: Reset DB & Debug Full Stack** | Wipe SQLite (if used), migrate, seed demo → then start both servers |
| **HMS: Django API (debug, :8001)** | Backend only with breakpoints |
| **HMS: Frontend Vite (:5173)** | Frontend only |

Open [http://localhost:5173](http://localhost:5173) after start. Login: **admin** / **adminpass123**.

### Terminal menu (Tasks)

`Terminal` → `Run Task…`:

- **HMS: Prepare** — env files, pip/npm install, migrate  
- **HMS: Reset database & seed** — fresh SQLite + demo data  
- **HMS: Run Full Stack (no debugger)** — both servers without debugpy  

### Command line (repo root)

```bash
npm run prepare   # or: make prepare
npm run reset     # or: make reset
npm run dev       # or: make dev
```
