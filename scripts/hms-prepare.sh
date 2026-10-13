#!/usr/bin/env bash
# Prepare env files, Python venv, npm deps, and apply migrations (no data wipe).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> HMS prepare"

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "    Created backend/.env from example (SQLite by default)"
fi

if [[ ! -f frontend/.env ]]; then
  cp frontend/.env.example frontend/.env
  echo "    Created frontend/.env"
fi

if [[ ! -d backend/.venv ]]; then
  echo "    Creating Python venv..."
  python3 -m venv backend/.venv
fi

# shellcheck disable=SC1091
source backend/.venv/bin/activate
pip install -q -r backend/requirements/dev.txt

if [[ ! -d frontend/node_modules ]]; then
  echo "    Installing frontend npm packages..."
  (cd frontend && npm install)
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  if grep -q "django.db.backends.postgresql" backend/.env 2>/dev/null; then
    echo "    Starting PostgreSQL (Docker)..."
    docker compose up -d db || true
    sleep 2
  fi
fi

echo "    Running migrations..."
(cd backend && python manage.py migrate --noinput)

echo "==> HMS prepare done"
