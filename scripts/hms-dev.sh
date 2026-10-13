#!/usr/bin/env bash
# Run API + UI together (foreground). Use VS Code "Debug Full Stack" for debugging.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "${HMS_SKIP_PREPARE:-}" != "1" ]]; then
  "$ROOT/scripts/hms-prepare.sh"
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js/npx is required for the frontend."
  exit 1
fi

cd "$ROOT"
npx --yes concurrently@9 \
  --names "api,web" \
  --prefix-colors "blue,green" \
  "cd backend && source .venv/bin/activate && python manage.py runserver 8001" \
  "cd frontend && npm run dev"
