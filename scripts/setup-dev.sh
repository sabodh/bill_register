#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

USE_DOCKER=0
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "==> Starting PostgreSQL (Docker)..."
  docker compose up -d db
  USE_DOCKER=1
  echo "==> Waiting for PostgreSQL container..."
  sleep 4
else
  echo "==> Docker not available. Using SQLite in backend/.env"
fi

echo "==> Backend virtualenv and dependencies..."
cd "$ROOT/backend"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements/dev.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

if [[ "$USE_DOCKER" -eq 0 ]]; then
  cat > .env <<'EOF'
DEBUG=True
SECRET_KEY=dev-only-change-me-use-32-plus-chars-minimum
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

CORS_ALLOWED_ORIGINS=http://localhost:5173
UHID_PREFIX=HMS
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7
EOF
  echo "Wrote backend/.env (SQLite)"
fi

if [[ "$USE_DOCKER" -eq 1 ]]; then
  echo "==> Waiting for database connection..."
  for _ in $(seq 1 30); do
    if python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.db import connection
connection.ensure_connection()
" 2>/dev/null; then
      break
    fi
    sleep 1
  done
fi

python manage.py migrate
python manage.py seed_demo

cd "$ROOT/frontend"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created frontend/.env"
fi
if [[ ! -d node_modules ]]; then
  npm install
fi

echo ""
echo "Setup complete."
echo "  Terminal 1: cd backend && source .venv/bin/activate && python manage.py runserver 8001"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Login: admin / adminpass123"
if [[ "$USE_DOCKER" -eq 0 ]]; then
  echo "  (Using SQLite. Start Docker and re-run this script for PostgreSQL.)"
fi
