# Teardown & local dev

Everything runs **locally only** — no hosted frontend, no hosted API, no surprise bills.

Repo: https://github.com/AravindMohan10/concrete-takeoff-copilot

## Bring down production (one-time)

### 1. Delete Render backend

1. [Render Dashboard](https://dashboard.render.com) → `concrete-takeoff-copilot-api`
2. **Settings** → **Delete Web Service** → confirm

### 2. Delete Railway backend (if you created one)

1. [Railway Dashboard](https://railway.app/dashboard) → open the project
2. **Settings** → **Delete Project** → confirm

### 3. Delete Vercel frontend

1. [Vercel Dashboard](https://vercel.com) → `concrete-takeoff-copilot`
2. **Settings** → **Advanced** → **Delete Project** → confirm

Or via CLI:

```bash
cd frontend
vercel login   # if needed
vercel remove concrete-takeoff-copilot --yes
```

## Run locally

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3002

## Cost

- **Local only:** you pay Anthropic only when you run extractions yourself (~$0.002–0.006 each)
- **No Render / Railway / Vercel** = zero hosting cost

Keep `ANTHROPIC_API_KEY` in `backend/.env` only — never commit it or put it in the frontend.
