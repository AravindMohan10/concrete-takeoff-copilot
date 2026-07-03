# Concrete Takeoff Copilot

A demo takeoff tool for structural/concrete drawings:

**PDF upload → footing schedule extraction → CY quantities → CSV export**

Built as a portfolio piece for concrete estimation workflows.

## Architecture

```
┌─────────────┐     multipart/form-data      ┌──────────────┐
│  Next.js    │  ─────────────────────────►  │   FastAPI    │
│  (React)    │                              │   (Python)   │
│             │  ◄── JSON / CSV ───────────  │              │
└─────────────┘                              └──────┬───────┘
                                                    │
                                            PyMuPDF (render PDF)
                                            Claude vision (extract table)
```

## Quick start

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

## What to test

Upload a structural PDF with a **footing schedule** table (usually sheet S1.x). Click **Extract Schedule**, review quantities, **Export CSV**.

Sample PDFs are in [`samples/`](samples/) (public structural drawings).

| File | Notes |
|------|--------|
| `huntsville-sam-houston-s400.pdf` | Best first test — F1, F2, F3 schedule (1 page) |
| `bullhead-city-structural-fbo.pdf` | FT1, FT2 footing schedule (5 pages) |
| `medstar-leonardtown-foundation.pdf` | Commercial footing schedule (5 pages) |
| `portland-foundation-s500.pdf` | Harder layout (2 pages) |
| `nist-nzertf-architectural-plans.pdf` | NIST net-zero house, architectural (20 pages) |

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind
- **Backend:** FastAPI, PyMuPDF, Anthropic Claude (Haiku → Sonnet fallback, prompt caching)
- **Domain:** Footing schedule → cubic yard takeoff

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for Railway + Vercel setup.

Quick summary:
- **Backend** → Railway (`backend/` root), set `ANTHROPIC_API_KEY`
- **Frontend** → Vercel (`frontend/` root), set `NEXT_PUBLIC_API_URL` to Railway URL

## Project structure

```
backend/
  app/main.py        # API routes
  app/pdf_utils.py   # PDF → PNG rendering
  app/extractor.py   # Vision LLM extraction
  app/models.py      # Pydantic schemas (FootingRow, etc.)

frontend/
  src/app/page.tsx           # Main UI
  src/lib/api.ts             # Backend client
  src/components/            # Upload, viewer, table
```
