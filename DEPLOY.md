# Deploy guide

Deploy **backend → Render or Railway**, **frontend → Vercel**.

Repo: https://github.com/AravindMohan10/concrete-takeoff-copilot

## 1. Backend (pick one)

### Option A: Render (one-click)

1. Open [Render deploy](https://render.com/deploy?repo=https://github.com/AravindMohan10/concrete-takeoff-copilot)
2. Connect GitHub if prompted
3. Set **`ANTHROPIC_API_KEY`** when asked
4. Click **Apply** / deploy
5. Copy your service URL (e.g. `https://takeoff-api.onrender.com`)
6. Test: `curl https://YOUR-URL/health` → `{"status":"ok"}`

> Free tier sleeps after ~15 min idle. First request may take 30–60s to wake.

### Option B: Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `concrete-takeoff-copilot`
3. **Settings → Root Directory** → `backend`
4. **Variables** → add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | your key |
| `ANTHROPIC_MODEL_FAST` | `claude-haiku-4-5-20251001` |
| `ANTHROPIC_MODEL_STRONG` | `claude-sonnet-4-6` |
| `ENABLE_SONNET_FALLBACK` | `true` |
| `ENABLE_PROMPT_CACHE` | `true` |
| `PDF_DPI_FAST` | `200` |
| `PDF_DPI_STRONG` | `250` |

5. **Settings → Networking → Generate Domain**
6. Copy the public URL and test `/health`

## 2. Frontend (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) → import `concrete-takeoff-copilot`
2. **Root Directory** → `frontend`
3. **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | your backend URL (no trailing slash) |

4. Deploy
5. Copy your Vercel URL (e.g. `https://concrete-takeoff-copilot.vercel.app`)

## 3. Wire CORS (optional)

Back on Render/Railway, add:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Redeploy backend. Vercel preview URLs (`*.vercel.app`) are already allowed by regex.

## 4. Smoke test

1. Open your Vercel URL
2. Upload `samples/portland-foundation-s500.pdf`
3. Extract page 1 → should return 5 footings
4. Export CSV

## CLI alternative (Vercel)

```bash
cd frontend
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # paste backend URL
vercel --prod
```

## Cost notes

- Render free / Railway ~$5 credit: enough for demo
- Vercel: free for hobby
- Anthropic: ~$0.002–0.006 per extract

Keep `ANTHROPIC_API_KEY` server-side only — never in the frontend.

## Guardrails (API cost protection)

The backend ships with rate limits to protect your Anthropic key on the public demo:

| Limit | Default | Applies to |
|-------|---------|------------|
| PDF size | 25 MB | all uploads |
| PDF pages | 50 | all uploads |
| PDF ops | 30/min per IP | info + render (no LLM cost) |
| Extractions | 5/hour per IP | extract + CSV export |
| Extractions | 15/day per IP | extract + CSV export |
| Global extractions | 50/day (UTC) | all users combined |

Tune via env vars in `backend/.env.example`. Check live usage: `GET /api/usage`.

**Optional demo token** — blocks direct API calls (curl/scripts) that bypass your frontend:

1. Generate a secret: `openssl rand -hex 16`
2. Render → `DEMO_ACCESS_TOKEN` = that value
3. Vercel → `NEXT_PUBLIC_DEMO_ACCESS_TOKEN` = same value
4. Redeploy both

Without the token, rate limits still apply. CORS blocks browser requests from random sites but not server-side bots — the limits above are the main defense.
