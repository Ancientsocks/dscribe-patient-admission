# DScribe — Patient Admission Management

A complete, production-shaped hospital admission management application built for the
**DScribe (Unriddle Technologies) Software Engineer Intern – Round 1** assessment.

Hospital front-desk staff can admit patients, search and filter the register, edit records,
discharge patients and remove records — all backed by a real Python API and a persistent
database. Nothing is mocked: every screen reads and writes live data.

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios
- **Backend:** Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2 ORM
- **Database:** SQLite (default, file-based, survives restarts) with a switch to PostgreSQL via one env var

---

## Table of contents

1. [Features](#features)
2. [Screenshots](#screenshots)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Local setup](#local-setup)
8. [Environment configuration](#environment-configuration)
9. [Database initialisation and seed data](#database-initialisation-and-seed-data)
10. [Testing](#testing)
11. [API reference](#api-reference)
12. [Validation rules](#validation-rules)
13. [Deployment](#deployment)
14. [Publishing to GitHub](#publishing-to-github)
15. [Design and engineering notes](#design-and-engineering-notes)
16. [Known limitations](#known-limitations)

---

## Features

### Dashboard
- Total patients, currently admitted, discharged and active wards, refreshed from the API
- Ward-wise and department-wise distribution charts
- Recent admissions list with status badges
- Loading skeletons, error banner with retry, empty state

### Patient register
- Professional, responsive table (desktop/tablet) that becomes readable cards on mobile
- Pagination with page size selector and "showing X–Y of Z" summary
- Debounced, case-insensitive partial **name search**
- **Ward**, **department** and **doctor** filters, usable simultaneously, plus an admission
  status filter
- One-click **clear all filters**
- Edit, discharge and delete row actions
- Loading skeletons, API failure state with retry, empty states for both "no patients" and
  "no matches"

### Add / edit patient
- Full admission form with dropdowns fed by the backend's central option list and a native
  date picker capped at today
- Inline validation on submit plus backend field errors mapped directly onto the inputs
- Success and error toasts; submit is disabled while a request is in flight (no duplicate
  admissions)
- Edit form is prefilled from the API and preserves untouched fields

### Discharge and delete
- Dedicated discharge action with confirmation dialog; status moves Admitted → Discharged and
  the original admission date is preserved
- Deleting always requires confirmation and removes the row immediately after success
- Server-side rules reject double discharge and re-admitting a discharged patient

### Platform
- Centralised API error envelope (`code`, `message`, `field details`)
- Centralised exception handlers, CORS, health check, Swagger/OpenAPI docs
- CORS allows the deployed frontend origin (and `*.vercel.app` previews)
- Tables are created on startup without ever dropping data; seeding is idempotent

---

## Screenshots

| Dashboard | Patient register |
| --- | --- |
| ![Dashboard](screenshots/01-dashboard.png) | ![Patients](screenshots/02-patients.png) |

| Add patient | Inline validation |
| --- | --- |
| ![Add patient](screenshots/03-add-patient.png) | ![Validation](screenshots/07-add-patient-validation.png) |

| Mobile dashboard | Mobile register |
| --- | --- |
| ![Mobile dashboard](screenshots/04-mobile-dashboard.png) | ![Mobile patients](screenshots/05-mobile-patients.png) |

| Tablet form |
| --- |
| ![Tablet form](screenshots/06-tablet-add-patient.png) |

> Screenshots were captured from the running application (Chrome, 1440×900 / 820×900 / 390×844 viewports).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend framework | React 18 (JavaScript) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Backend language | Python 3.12 |
| Web framework | FastAPI 0.115 |
| Validation | Pydantic v2 (schemas + field validators) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (dev) / PostgreSQL-compatible URL (prod) |
| Testing | pytest + FastAPI TestClient (backend), Vitest + React Testing Library (frontend) |

Node.js is used **only** as frontend tooling. All business logic, validation, persistence and
tests live in Python.

---

## Architecture

```
┌────────────────────────────┐        HTTPS / JSON        ┌──────────────────────────────┐
│  React SPA (Vite)          │  ───────────────────────▶  │  FastAPI                     │
│                            │                            │                              │
│  pages/  →  services/      │   /api/patients            │  api/       routers          │
│  hooks/  →  components/    │   /api/dashboard/stats     │  schemas/   Pydantic         │
│                            │   /api/options             │  services/  business rules   │
│  Central OptionsProvider   │   /api/health              │  models/    SQLAlchemy       │
└────────────────────────────┘                            └──────────────┬───────────────┘
                                                                          │ SQLAlchemy
                                                                          ▼
                                                          ┌──────────────────────────────┐
                                                          │ SQLite file  (or PostgreSQL) │
                                                          └──────────────────────────────┘
```

**Request flow:** route → Pydantic schema (validation) → service (business rules, filters,
transactions) → SQLAlchemy model → database. Failures raise typed errors that the central
handlers convert into a single JSON envelope:

```json
{
  "detail": "Name may contain only letters and spaces (no numbers or special characters).",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name may contain only letters and spaces (no numbers or special characters).",
    "details": [{ "field": "name", "message": "Name may contain only letters and spaces (no numbers or special characters)." }]
  }
}
```

The frontend maps `error.details[].field` straight onto the matching form input.

---

## Project structure

```
patient-admission-management/
├── backend/
│   ├── app/
│   │   ├── api/              # patients, dashboard, options, health routers
│   │   ├── core/             # config, central options, validation helpers, error handlers
│   │   ├── database/         # declarative base + engine/session management
│   │   ├── models/           # Patient SQLAlchemy model
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # patient and dashboard business logic
│   │   ├── main.py           # FastAPI app factory (CORS, docs, exception handlers)
│   │   └── seed.py           # idempotent demo-data command
│   ├── tests/                # pytest suite (75 tests)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── Procfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # table, form, charts, dialogs, toasts, skeletons…
│   │   ├── pages/            # Dashboard, Patients, AddPatient, EditPatient, NotFound
│   │   ├── layouts/          # AppLayout (sidebar + topbar shell)
│   │   ├── services/         # axios client + patient API wrappers
│   │   ├── hooks/            # options provider, toast provider, debounce
│   │   ├── utils/            # validation, formatting
│   │   ├── styles/           # Tailwind layers and component classes
│   │   ├── test/             # Vitest setup (jsdom + jest-dom)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── eslint.config.js
│   ├── tailwind.config.cjs
│   ├── postcss.config.cjs
│   ├── vercel.json
│   └── .env.example
├── screenshots/
├── render.yaml               # Render blueprint for the API (+ persistent disk)
├── README.md
└── .gitignore
```

---

## Prerequisites

- **Python 3.11+** (developed on 3.12)
- **Node.js 18+** and npm (frontend tooling only)
- No database server required for local development (SQLite file)

---

## Local setup

### 1. Clone

```bash
git clone https://github.com/<your-username>/dscribe-patient-admission.git
cd dscribe-patient-admission
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env

# optional: load demo patients (safe to re-run, never overwrites existing rows)
python -m app.seed

uvicorn app.main:app --reload --port 8000
```

- API: <http://localhost:8000/api/health>
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI JSON: <http://localhost:8000/openapi.json>

The SQLite file (`backend/dscribe.db`) is created automatically on first start.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # optional; the dev server proxies /api to port 8000
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to
`http://127.0.0.1:8000`, so no CORS configuration is needed locally.

### 4. Production build

```bash
cd frontend
npm run build          # outputs frontend/dist
npm run preview        # serve the build locally
```

---

## Environment configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `ENVIRONMENT` | `development` | Environment name reported by the health check |
| `DATABASE_URL` | `sqlite:///./dscribe.db` | SQLAlchemy URL. PostgreSQL: `postgresql+psycopg://user:pass@host:5432/db` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma separated allowed browser origins |
| `DOCTORS` | built-in roster | Comma separated doctor list (central dropdown source) |
| `MAX_PAGE_SIZE` | `100` | Upper bound for `page_size` |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | *(empty → `/api` proxy)* | Full API base URL, e.g. `https://dscribe-patient-api.onrender.com/api` |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8000` | Backend target for the dev-server proxy |

Secrets are never committed: `.env` is git-ignored and only `.env.example` is tracked.

---

## Database initialisation and seed data

- Tables are created on application startup (`Base.metadata.create_all`) — a **safe,
  non-destructive** operation; existing rows are never dropped or reset.
- Adding a new environment only requires starting the server.
- Demo data:

```bash
cd backend
python -m app.seed
```

Seeding skips any admission that already exists with the same name, ward and admission date,
so it can run repeatedly without duplicating or overwriting records.

For PostgreSQL, set `DATABASE_URL` and install a driver:

```bash
pip install "psycopg[binary]"
```

---

## Testing

Two automated suites, both run from a clean checkout.

### Backend — pytest (75 tests)

Covers CRUD, search, every filter, combined filters, pagination, all validation boundaries,
status rules, dashboard aggregation and persistence across a simulated application restart:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

Latest local run:

```
75 passed
```

### Frontend — Vitest + React Testing Library (52 tests)

Runs in jsdom against the real components and pages, with the API layer mocked:

```bash
cd frontend
npm test               # single run (vitest run)
npm run test:watch     # watch mode
npm run lint           # ESLint flat config, zero errors
```

Latest local run:

```
Test Files  7 passed (7)
     Tests  52 passed (52)
```

| Area | What is asserted |
| --- | --- |
| Validation utils | Letters-only names, 0/120 age boundaries, decimals, negative and junk ages, option-list membership, future and impossible dates, payload normalisation |
| API error mapping | Error envelope + field details, fallback messages for 404/500/400, unreachable API, cancellation, idempotent normalisation |
| Admission form | Field rendering, date capped at today, required-field errors, invalid name/age/date, valid submit payload, server field errors, disabled submit while saving |
| Patient register | Initial load and count, debounced search, ward filter, combined ward + department + doctor + status filters, clear-all, empty vs no-match states, error state with retry, pagination, delete and discharge confirmations, failed action toast |
| Dashboard | Totals, occupancy hint, ward/department distributions, recent admissions, error and empty states |
| Add / edit pages | Create payload and redirect, client-side blocking, backend field errors, prefill from API, update payload, 404 state |

Highlights of the backend assertions:

| Area | Tests |
| --- | --- |
| Create / read / update / delete | 201 responses, persisted fields, 404s after delete |
| Discharge | status + admission date preserved, 409 on double discharge, no re-admission via PUT |
| Duplicates | identical active admission returns 409 |
| Search | case-insensitive partial match, wildcard escaping, empty results |
| Filters | ward, department, doctor, multi-value OR, combined with search, status |
| Pagination | metadata, page boundaries, page-size guard rails |
| Validation | letters-only names, age 0/120 boundaries, decimals/negative/junk, missing fields, invalid dropdowns, future dates, malformed JSON, null updates |
| Dashboard | totals, ward/department distributions, recent admission ordering |
| Persistence | records survive engine teardown and app rebuild against the same file |

In addition to the automated suites, the complete user journey was exercised against the
running application in a real browser (dashboard, create, search, filter combinations, edit,
discharge confirmation, delete confirmation, validation messages, mobile/tablet layouts).

---

## API reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service + database health |
| `GET` | `/options` | Central gender / ward / department / doctor / status lists |
| `GET` | `/patients` | Paginated list with `search`, `ward`, `department`, `doctor`, `status`, `page`, `page_size` |
| `GET` | `/patients/{id}` | Single patient |
| `POST` | `/patients` | Create an admission (`201`) |
| `PUT` | `/patients/{id}` | Update a patient (partial payloads allowed) |
| `DELETE` | `/patients/{id}` | Delete a patient |
| `PATCH` | `/patients/{id}/discharge` | Mark a patient as discharged |
| `GET` | `/dashboard/stats` | Totals, distributions and recent admissions |

Example:

```bash
curl "http://localhost:8000/api/patients?search=an&ward=ICU&department=Cardiology&page=1&page_size=10"
```

```json
{
  "items": [
    {
      "id": 9,
      "name": "Ananya Sharma",
      "age": 34,
      "gender": "Female",
      "ward": "ICU",
      "department": "Cardiology",
      "doctor": "Dr. Aisha Verma",
      "admission_date": "2026-11-13",
      "status": "Admitted",
      "created_at": "2026-11-25T14:23:26.966409+00:00",
      "updated_at": "2026-11-25T14:23:26.966409+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1,
  "has_next": false,
  "has_previous": false,
  "applied_filters": { "search": "an", "ward": ["ICU"], "department": ["Cardiology"], "doctor": [], "status": null }
}
```

Status codes: `200` OK · `201` Created · `404` Not found · `409` Conflict / invalid status
transition · `422` Validation error · `503` Database unavailable.

Interactive documentation: **`/docs`** (Swagger UI) and **`/redoc`**.

---

## Validation rules

Enforced in the browser **and** again in Pydantic, so a bypassed UI still cannot store bad data.

| Field | Rules |
| --- | --- |
| Name | Required; letters and spaces only; single spaces between name parts; trimmed; ≤ 100 chars |
| Age | Required; whole number; 0–120; decimals, negatives and junk rejected |
| Gender | Required; one of Male, Female, Other |
| Ward | Required; one of General Ward, ICU, Emergency, Private Ward, Pediatric Ward, Maternity Ward |
| Department | Required; one of Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, Oncology, Surgery |
| Doctor | Required; must match the configured roster (`DOCTORS` env var or built-in list) |
| Admission date | Required; valid date; cannot be in the future |
| Status | Admitted or Discharged only; discharged records cannot be re-admitted |

Option lists live in one place (`backend/app/core/options.py`) and are served through
`GET /api/options`; the frontend never hardcodes them.

---

## Deployment

### Backend — Render (FastAPI + persistent disk)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, select the repo (it reads `render.yaml`), or create a Web
   Service manually:
   - **Root directory:** `backend`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health check path:** `/api/health`
3. Environment variables:
   - `DATABASE_URL=sqlite:////var/data/dscribe.db` (the `render.yaml` disk is mounted at `/var/data`) — or a PostgreSQL URL
   - `CORS_ORIGINS=https://<your-frontend>.vercel.app`
   - `DOCTORS=...` (optional)
   - `ENVIRONMENT=production`
4. Deploy, then confirm `https://<your-api>.onrender.com/api/health` returns
   `{"status": "ok", "database": "ok"}`.

> Render's free plan does not support persistent disks. Either use a paid instance with the
> disk from `render.yaml`, or point `DATABASE_URL` at a managed PostgreSQL database so data
> survives restarts.

### Frontend — Vercel

1. Import the repository, set **Root Directory** to `frontend` (Vite preset; `vercel.json`
   already defines the SPA rewrite).
2. Add `VITE_API_BASE_URL=https://<your-api>.onrender.com/api`.
3. Deploy and verify all CRUD operations plus the dashboard against the deployed API.

### Live URLs

| Environment | URL |
| --- | --- |
| Frontend (live) | _Not deployed yet — add the Vercel URL here_ |
| Backend API | _Not deployed yet — add the Render URL here_ |
| API docs | `<backend-url>/docs` |

The application has been verified end-to-end locally. Hosting credentials were not available
in the build environment, so no live URL is claimed.

---

## Publishing to GitHub

```bash
git init
git add .
git commit -m "feat: DScribe patient admission management (React + FastAPI)"

git branch -M main
git remote add origin https://github.com/<your-username>/dscribe-patient-admission.git
git push -u origin main
```

Verify before pushing:

```bash
git status --ignored        # .env, *.db, .venv, node_modules and dist must be ignored
grep -r "PASSWORD\|SECRET\|API_KEY" --exclude-dir=node_modules --exclude-dir=.venv .
```

Then submit the public repository link and the live application link to
`pramod@dscribe.in` and `suhasm@dscribe.in` with your full name in the subject line.

---

## Design and engineering notes

- **One source of truth for options** — the backend owns the dropdown lists; the React app
  fetches them once through `OptionsProvider`. Adding a ward or department is a one-line change.
- **Validation at both ends** — the frontend gives instant inline feedback; Pydantic is the
  authority and returns field-level messages the UI renders in place.
- **Transactions everywhere** — every write commits or rolls back explicitly, so a failed
  request can never leave partial data.
- **Predictable errors** — one envelope for validation, not-found, conflict, database and
  unexpected failures; the UI shows friendly text and never swallows errors.
- **No destructive startup** — `create_all` only adds missing tables; seeding is idempotent.
- **Accessibility** — labelled inputs, `aria-invalid`/`aria-describedby` on errors, focus
  management in dialogs, keyboard-dismissable modals, status announcements via `role="status"`,
  visible focus rings, AA-level colour contrast, and reduced-motion support.
- **Responsive by design** — desktop table, tablet layout and a card-based mobile register;
  sidebar collapses into an off-canvas drawer.

---

## Known limitations

- Authentication is intentionally out of scope (the brief states login is not required).
- No billing, bed allocation or clinical notes — the scope is patient admission management.
- SQLite is used by default; concurrent write-heavy deployments should use PostgreSQL.
- `PUT /api/patients/{id}` accepts partial payloads (all fields optional) to support inline
  edits, while still validating every value that is sent.
