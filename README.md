# SENTINEL Onboarding — Halcyon Capital Partners

Prototype for client onboarding risk assessment at a UK wealth management firm. Relationship managers log assessments at point of intake; the system computes risk tier from regulatory criteria and maintains an audit-ready compliance record.

**Stack:** FastAPI (Python) + Next.js (React/TypeScript)

## Features

- **Records** — Browse ~46 onboarding records from four branches (CSV seed data)
- **New Assessment** — Tablet-friendly intake form with live risk classification
- **Audit View** — Findings for missing fields, risk mismatches, and compliance gaps in legacy data
- **Risk engine** — HIGH / MEDIUM / LOW per SENTINEL rules (highest applicable tier)
- **Strict new records** — Cannot save without ID verification date, documentation, or with invalid HIGH-risk approval

## Quick start

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run from the `backend` directory so `app.main` resolves correctly.

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_API_URL` if the API is not on `http://127.0.0.1:8000`.

## Project layout

```
├── client_onboarding.csv    # Seed data (46 records, intentionally messy)
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── risk_engine.py   # SENTINEL classification rules
│   │   ├── data_loader.py   # CSV load + audit enrichment
│   │   └── models.py        # Pydantic schemas
│   └── requirements.txt
└── frontend/
    ├── app/                 # Next.js App Router
    └── components/          # UI (intake, records, audit)
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/records` | List records (`?branch=`, `?findings_only=`, `?risk=`) |
| GET | `/api/records/{client_id}` | Single record |
| POST | `/api/records` | Create assessment (validated) |
| POST | `/api/classify` | Preview risk tier + triggered rules |
| GET | `/api/audit/summary` | KPI counts for dashboard |
| GET | `/api/meta/options` | Form dropdown values |

Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Risk classification (summary)

- **HIGH** — PEP, sanctions match, adverse media, or tax residence in Russia / Belarus / Venezuela
- **MEDIUM** — Entity client, elevated jurisdiction, or income > £500k with Inheritance / Gift / Other source
- **LOW** — None of the above

## Architecture notes (debrief)

| Concern | Approach |
|---------|----------|
| **Offline-first** | IndexedDB queue at branch + service worker; sync API with idempotency keys and conflict resolution on `client_id` |
| **Regulatory change** | Rules engine as versioned JSON/config in DB; effective-dated rule sets; no deploy for threshold changes |
| **FCA record-keeping** | Immutable event log (who/when/what), RBAC, cryptographic timestamps, separate read model for auditors |
| **Multi-branch scale** | Stateless API + branch-scoped tenancy; central Postgres; CDN for static app; same rules engine |

## Brand

Halcyon palette and Inter typography per assessment brief — local Inter variable fonts in `frontend/public/assets/font/Inter/`. Optimised for 1024×768 tablet landscape with 44px minimum tap targets.
