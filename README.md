# Concrete Takeoff Copilot

A demo takeoff tool for structural/concrete drawings:

**PDF upload → footing schedule extraction → CY quantities → CSV export**

Built as a portfolio piece for concrete estimation workflows.

## Live demo

| | URL |
|---|---|
| **App** | https://frontend-sable-three-96.vercel.app |
| **Full workspace** | https://frontend-sable-three-96.vercel.app/try |
| **API** | https://takeoff-api-51xd.onrender.com |
| **GitHub** | https://github.com/AravindMohan10/concrete-takeoff-copilot |

Upload a foundation PDF, find the footing schedule sheet, extract rows, edit anything wrong, export CSV.

> The API runs on Render's free tier and sleeps after ~15 min of inactivity. The first request after idle can take 30–60 seconds.

## Architecture

```
┌─────────────┐     multipart/form-data      ┌──────────────┐
│  Next.js    │  ─────────────────────────►  │   FastAPI    │
│  (Vercel)   │                              │  (Render)    │
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

- **Frontend:** Next.js, TypeScript, Tailwind (Vercel)
- **Backend:** FastAPI, PyMuPDF, Anthropic Claude (Haiku → Sonnet fallback, prompt caching) (Render)
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

## Deploy

Both services are live. To redeploy or fork:

- **Frontend** → Vercel, root directory `frontend`, env `NEXT_PUBLIC_API_URL`
- **Backend** → Render, root directory `backend`, env `ANTHROPIC_API_KEY`

Full steps: **[DEPLOY.md](DEPLOY.md)** (includes API guardrails and cost limits)

## Guardrails

Public demo protections on the API:

- **Rate limits** — 5 extractions/hour and 15/day per IP; 50/day global cap
- **Upload limits** — 25 MB max PDF, 50 pages max
- **Optional demo token** — `DEMO_ACCESS_TOKEN` / `NEXT_PUBLIC_DEMO_ACCESS_TOKEN` blocks direct API scripts

See `backend/.env.example` for all tunables. Usage snapshot: `GET /api/usage`.

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
