# AGENTS.md — Healthcare Management Platform

## Architecture

- **Modular monolith**: Django apps under `backend/apps/` (`core`, `lab`, `billing`, `pharmacy`, `clinical`).
- **Single patient table** in `core.Patient` shared by lab, OP, pharmacy, and face sheet later.
- **One billing engine (planned)**: generic line items with `item_type` in the `billing` app (not implemented yet).
- **Branch scoping**: users without `core.view_all_branches` only see records for their `User.branch`.
- **Soft delete**: patients, doctors, staff use `is_active=False`; do not hard-delete clinical/billing data.

## Repository layout

```
backend/
  config/          # settings (base, dev, test, prod), urls
  apps/core/       # users, roles, masters, audit, auth API
  apps/{lab,...}/  # placeholders for future modules
frontend/
  src/api/         # axios client, OpenAPI types
  src/auth/        # login, context, guards
  src/layout/      # app shell
  src/modules/     # feature pages
  src/config/menu.ts
```

## Conventions

- **Permissions**: every API view must declare `permission_classes` (or override `get_permissions`). Only `/api/auth/login/` and `/api/auth/refresh/` are public.
- **Permission codenames**: `app_label.action_model`, e.g. `core.view_patient`, `lab.view_test`, `billing.add_bill`.
- **Roles**: Django `Group` + data migration `0002_default_roles`.
- **API**: DRF viewsets, pagination, `django-filter`, OpenAPI via drf-spectacular.
- **Frontend**: Ant Design shell; menu items require a permission in `menu.ts` (hiding is cosmetic; server enforces).

## Database

- **Local dev default**: PostgreSQL (`django.db.backends.postgresql`, driver `psycopg` 3).
- **Docker**: `docker compose up -d db` from repo root (see `docker-compose.yml`).
- **Tests**: SQLite in memory via `config.settings.test` (no Postgres required for `pytest`).
- **Optional**: set `DB_ENGINE=django.db.backends.sqlite3` in `backend/.env` for zero-DB setup.

## Local dev automation

- **VS Code**: Run and Debug → **▶ HMS: Debug Full Stack** or **🔄 HMS: Reset DB & Debug Full Stack**
- **CLI**: `npm run prepare` | `npm run reset` | `npm run dev` (from repo root)
- API **:8001**, UI **:5173** (Vite proxies `/api` → backend)

## Running tests

```bash
cd backend && source .venv/bin/activate && pytest
```

Permission regression test: `apps/core/tests/test_permissions.py`.

## Dependencies

Ask before adding new libraries to backend `requirements/` or `frontend/package.json`.
