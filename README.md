# Healthcare Management Platform

Modular monolith for hospital and lab operations (Django REST API + React/Vite UI). Core flows that run today: login, users/roles, registration, patients, doctors/staff, lab catalog, lab billing, results, and reports.

Pharmacy and face sheet are still placeholders in the menu.

## What you get after setup

| Piece | URL | Notes |
|-------|-----|--------|
| UI | http://localhost:5173 | Vite; proxies `/api` and `/media` to the backend |
| API | http://localhost:8001 | Django on **8001** so 8000 stays free |
| API docs | http://localhost:8001/api/docs/ | Requires a logged-in user (JWT) |
| Demo login | **admin** / **adminpass123** | Created by `python manage.py seed_demo` |

Do not use this demo password outside local development.

---

## Prerequisites

Install these on the machine before the first run:

| Tool | Version | Why |
|------|---------|-----|
| Python | 3.13+ (3.14 is fine in dev) | Django backend |
| Node.js | 20+ (LTS is fine) | Vite frontend |
| Git | any recent | clone / pull |
| PostgreSQL 15+ or Docker | optional | default DB in `.env.example`; **SQLite works with no extra install** |
| VS Code / Cursor | recommended | debug launch configs |

### Windows — install runtimes (winget)

Open **PowerShell as your normal user** (not necessarily Administrator):

```powershell
winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
```

Then **close and reopen the terminal** so `python` and `node` are on `PATH`. Confirm:

```powershell
python --version   # Python 3.13.x
node --version     # v20+ or v24 LTS
npm --version
```

If `python` still opens the Microsoft Store stub, use the full path once:

`%LOCALAPPDATA%\Programs\Python\Python313\python.exe`

Typical Node path: `C:\Program Files\nodejs\`

### macOS

Python 3.13+ and Node 20+ via Homebrew (or pyenv / nvm). Docker Desktop is optional for PostgreSQL.

---

## Windows setup (SQLite — no Docker)

This is the fastest path on a new Windows machine.

From the repo root (`bill_register`):

### 1. Backend env file

Copy the example, then switch the database to SQLite (uncomment those two lines and ignore PostgreSQL settings):

```powershell
copy backend\.env.example backend\.env
```

Edit `backend/.env`:

```
DEBUG=True
SECRET_KEY=dev-only-change-me-use-32-plus-chars-minimum
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

UHID_PREFIX=HMS
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7
```

`backend/.env` is gitignored. Never commit a real `SECRET_KEY`.

### 2. Python venv and packages

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements\dev.txt
```

If PowerShell blocks activation: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3. Database + demo data

Still in `backend` with the venv active:

```powershell
python manage.py migrate --noinput
python manage.py seed_demo
```

SQLite file: `backend/db.sqlite3` (gitignored). Re-run `seed_demo` anytime; it is idempotent for the admin user.

### 4. Frontend env and packages

```powershell
cd ..\frontend
copy .env.example .env
npm install
```

`frontend/.env` should contain:

```
VITE_API_BASE_URL=/api
```

`npm install` uses `frontend/.npmrc` (`legacy-peer-deps=true`) because TypeScript 6 and `openapi-typescript` currently disagree on a peer range. Do not drop that file.

### 5. Run both servers

Two terminals, **venv activated in the backend one**:

```powershell
# terminal 1 — API
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8001
```

```powershell
# terminal 2 — UI
cd frontend
npm run dev
```

Or from the repo root after the venv exists:

```powershell
npm run start:win
```

That starts API and UI in separate windows (`scripts/hms-start.ps1`).

Open http://localhost:5173 and sign in with **admin** / **adminpass123**.

---

## macOS / Linux quick start

Uses **PostgreSQL via Docker** when Docker is running; otherwise the setup script writes SQLite into `backend/.env`.

```bash
cd bill_register
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

For PostgreSQL: start [Docker Desktop](https://www.docker.com/products/docker-desktop/), then run the script again.

Then two terminals:

```bash
# API
cd backend && source .venv/bin/activate && python manage.py runserver 8001

# UI
cd frontend && npm run dev
```

If `make` is available: `make db-up`, `make setup` (db + migrate + seed), `make run-backend`, `make run-frontend`.

Root npm scripts (`npm run prepare` / `reset` / `dev`) call bash scripts under `scripts/` and expect a Unix shell.

---

## Backend setup (manual, any OS)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env          # then set SQLite or Postgres as below
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8001
```

### Environment variables (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DEBUG` | `True` in local dev |
| `SECRET_KEY` | Django secret; change before any shared/staging use |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` |
| `DB_ENGINE` | `django.db.backends.sqlite3` or `django.db.backends.postgresql` |
| `DB_NAME` | `db.sqlite3` (SQLite file name under `backend/`) or Postgres database name |
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Postgres only |
| `CORS_ALLOWED_ORIGINS` | must include the Vite origin (`http://localhost:5173`) |
| `UHID_PREFIX` | prefix for generated patient UHID |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | token lifetimes |

### PostgreSQL (optional)

From the **repo root** (not `backend/`):

```bash
docker compose up -d db
```

Compose uses Postgres 16, database `hms_dev`, user `hms`, password `hms_password`, port **5432**. Leave `DB_ENGINE=django.db.backends.postgresql` in `backend/.env` (the example file default).

#### PostgreSQL on macOS without Docker (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s hms || true
psql postgres -c "ALTER USER hms WITH PASSWORD 'hms_password';"
createdb -O hms hms_dev
```

Or use your own user and set `DB_USER` / `DB_PASSWORD` in `backend/.env`.

### Tests and lint (backend)

```bash
cd backend
# Windows: .\.venv\Scripts\Activate.ps1
source .venv/bin/activate
pytest
ruff check .
mypy apps config
```

Tests always use in-memory SQLite (`config.settings.test`). You do not need Postgres for `pytest`.

---

## Frontend details

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

| Script | What it does |
|--------|----------------|
| `npm run dev` | Vite on 5173 |
| `npm run build` | `tsc -b` then production bundle |
| `npm run lint` | oxlint + eslint |
| `npm run format` | Prettier |
| `npm run generate:api-types` | OpenAPI → `src/api/types/schema.d.ts` (backend must be running) |

Vite proxy (`frontend/vite.config.ts`): `/api` and `/media` → `http://localhost:8001`.

---

## JWT storage (frontend)

Access tokens stay in memory. Refresh tokens are stored in `localStorage` (`hms_refresh_token`). That is a local-SPA trade-off; httpOnly cookies can be adopted later.

---

## VS Code / Cursor — one-click start / reset

Install recommended extensions from `.vscode/extensions.json` (Python, debugpy, ESLint, Prettier). Point the Python interpreter at `backend/.venv`.

### Debug panel (Run and Debug)

| Launch config | What it does |
|---------------|----------------|
| **▶ HMS: Debug Full Stack** | Prepare (venv, migrate) → Django **debugger** on **:8001** + Vite on **:5173** |
| **🔄 HMS: Reset DB & Debug Full Stack** | Wipe SQLite (if used), migrate, seed demo → then start both servers |
| **HMS: Django API (debug, :8001)** | Backend only with breakpoints |
| **HMS: Frontend Vite (:5173)** | Frontend only |

Open http://localhost:5173 after start. Login: **admin** / **adminpass123**.

### Terminal menu (Tasks)

`Terminal` → `Run Task…`:

- **HMS: Prepare** — env files, pip/npm install, migrate
- **HMS: Reset database & seed** — fresh SQLite + demo data
- **HMS: Run Full Stack (no debugger)** — both servers without debugpy

### Command line (repo root, Unix)

```bash
npm run prepare   # or: make prepare
npm run reset     # or: make reset
npm run dev       # or: make dev
```

On Windows PowerShell use the numbered steps in **Windows setup** above, or `npm run start:win` after the venv and `npm install` exist.

---

## Smoke check

1. UI loads at http://localhost:5173/login
2. Sign in as `admin` / `adminpass123`
3. **Patients** lists demo rows (UHID `HMS-…`)
4. **Registration desk**, **Lab → Billing**, and **Lab → Test** open without API errors

If login says it cannot reach the API: the Django process on **8001** is not running, or Vite is not proxying `/api`.
