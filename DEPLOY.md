# Deploy guide

Deploy **backend → Railway**, **frontend → Vercel**.

## 1. Push to GitHub

```bash
cd /path/to/rudus
git init
git add .
git commit -m "Initial commit: Concrete Takeoff Copilot demo"
gh repo create rudus-takeoff --private --source=. --push
```

## 2. Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo
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
6. Copy the public URL (e.g. `https://rudus-demo-production.up.railway.app`)
7. Test: `curl https://YOUR-RAILWAY-URL/health` → `{"status":"ok"}`

## 3. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import GitHub repo
2. **Root Directory** → `frontend`
3. **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | your Railway URL (no trailing slash) |

4. Deploy
5. Copy your Vercel URL (e.g. `https://rudus-takeoff.vercel.app`)

## 4. Wire CORS (optional but recommended)

Back in Railway, add:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Redeploy backend. Vercel preview URLs (`*.vercel.app`) are already allowed by regex.

## 5. Smoke test

1. Open your Vercel URL
2. Upload `samples/portland-foundation-s500.pdf`
3. Extract page 1 → should return 5 footings
4. Export CSV

## CLI alternative

```bash
# Backend
cd backend
railway login
railway init
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway up

# Frontend
cd frontend
vercel login
vercel --prod
# Set NEXT_PUBLIC_API_URL in Vercel dashboard when prompted
```

## Cost notes

- Railway: free tier includes ~$5/month credit
- Vercel: free for hobby projects
- Anthropic: ~$0.002–0.006 per extract (Haiku / Sonnet fallback)

Keep `ANTHROPIC_API_KEY` server-side only — never expose it in the frontend.
