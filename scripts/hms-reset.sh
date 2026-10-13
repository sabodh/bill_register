#!/usr/bin/env bash
# Wipe local SQLite DB (if used), re-migrate, and seed demo data.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/hms-prepare.sh"

echo "==> HMS reset database"

if grep -q "django.db.backends.sqlite3" backend/.env 2>/dev/null; then
  rm -f backend/db.sqlite3
  echo "    Removed backend/db.sqlite3"
fi

(cd backend && source .venv/bin/activate && python manage.py migrate --noinput)
(cd backend && source .venv/bin/activate && python manage.py seed_demo)

echo "==> HMS reset done (login: admin / adminpass123)"
echo "    Tip: In the browser console run: localStorage.removeItem('hms_refresh_token')"
