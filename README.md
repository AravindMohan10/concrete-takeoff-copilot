# Concrete Takeoff Copilot

A demo takeoff tool for structural/concrete drawings:

**PDF upload → footing schedule extraction → CY quantities → CSV export**

Built as a portfolio piece for concrete estimation workflows. **Local only** — nothing is hosted in production.

## Links

| | URL |
|---|---|
| **GitHub** | https://github.com/AravindMohan10/concrete-takeoff-copilot |

Clone the repo and run backend + frontend locally (see below).

## Architecture

```
┌─────────────┐     multipart/form-data      ┌──────────────┐
│  Next.js    │  ─────────────────────────►  │   FastAPI    │
│  (local)    │                              │   (local)    │
│             │  ◄── JSON / CSV ───────────  │              │
└─────────────┘                              └──────┬───────┘
                                                    │
                                            PyMuPDF (render PDF)
                                            Claude vision (extract table)
```

## What to test

Upload a structural PDF with a **footing schedule** table (usually sheet S1.x). Click **Extract Schedule**, review quantities, **Export CSV**.

Sample PDFs are in [`samples/`](samples/) (public structural drawings).

| File | Notes |
|------|--------|
| `huntsville-sam-houston-s400.pdf` | Best first test — F1, F2, F3 schedule (1 page) |
| `portland-foundation-s500.pdf` | Verified — 5 footings, 2.04 CY total on page 1 |
| `bullhead-city-structural-fbo.pdf` | FT1, FT2 footing schedule (5 pages) |
| `medstar-leonardtown-foundation.pdf` | Commercial footing schedule (5 pages) |
| `nist-nzertf-architectural-plans.pdf` | NIST net-zero house, architectural (20 pages) |

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind
- **Backend:** FastAPI, PyMuPDF, Anthropic Claude (Haiku → Sonnet fallback, prompt caching)
- **Domain:** Footing schedule → cubic yard takeoff

## Run locally

### 1. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3002

- **/** — Landing page (what it is, learnings, embedded try)
- **/try** — Full-screen demo workspace

## Tests

```bash
# Backend (pytest + offline evals)
cd backend && source .venv/bin/activate && pip install -r requirements.txt && pytest

# Extraction evals (offline = free, live = uses Anthropic API)
cd backend && python -m eval.run_eval --offline

# Frontend (vitest + build)
cd frontend && npm install && npm test && npm run build
```

## Teardown

Hosted Render API and Vercel frontend are retired. Steps to delete any remaining cloud projects: **[DEPLOY.md](DEPLOY.md)**

## Guardrails

Rate limits still apply when running the API locally or if you re-host it:

- **Rate limits** — 5 extractions/hour and 15/day per IP; 50/day global cap
- **Upload limits** — 25 MB max PDF, 50 pages max
- **Optional demo token** — `DEMO_ACCESS_TOKEN` / `NEXT_PUBLIC_DEMO_ACCESS_TOKEN`

See `backend/.env.example` for all tunables. Usage snapshot: `GET /api/usage`.

## Evals

Extraction quality is measured against golden cases on real sample PDFs. See **[backend/eval/README.md](backend/eval/README.md)**.

```bash
cd backend && python -m eval.run_eval --offline   # free, CI-safe
cd backend && python -m eval.run_eval --live     # calls Anthropic (~$0.01 for 3 cases)
```

## Project structure

```
backend/
  app/main.py        # API routes
  app/pdf_utils.py   # PDF → PNG rendering
  app/extractor.py   # Vision LLM extraction
  app/models.py      # Pydantic schemas (FootingRow, etc.)

frontend/
  src/app/page.tsx           # Landing page
  src/app/try/page.tsx       # Full-screen demo
  src/components/TakeoffDemo.tsx
  src/lib/api.ts             # Backend client
```
