#!/usr/bin/env bash
# Run backend + frontend together for local dev
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting backend on :8000..."
cd "$ROOT/backend"
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on :3002..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
