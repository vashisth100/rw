#!/bin/bash
# RoadWatch AI v4 — One-click launcher for Linux/macOS

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BOLD}============================================${NC}"
echo -e "${BOLD}   RoadWatch AI v4 — Starting Services      ${NC}"
echo -e "${BOLD}============================================${NC}"
echo ""

# Check Node
command -v node &>/dev/null || { echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"; exit 1; }
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Install deps
echo -e "\n[1/4] Installing backend dependencies..."
cd "$ROOT/backend" && npm install --silent
echo -e "${GREEN}✓ Backend ready${NC}"

echo "[2/4] Installing frontend dependencies..."
cd "$ROOT/frontend" && npm install --silent
echo -e "${GREEN}✓ Frontend ready${NC}"

# MongoDB
echo "[3/4] Starting MongoDB..."
if command -v mongod &>/dev/null; then
  if ! pgrep -x "mongod" &>/dev/null; then
    mkdir -p "$HOME/data/db"
    mongod --dbpath "$HOME/data/db" --fork --logpath "$HOME/data/mongod.log" &>/dev/null || true
    sleep 2
  fi
  echo -e "${GREEN}✓ MongoDB ready${NC}"
else
  echo -e "${YELLOW}⚠ MongoDB not local — using MONGODB_URI from .env${NC}"
fi

# Start services
echo "[4/4] Launching all services..."
cd "$ROOT/backend"  && node src/server.js &   BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started${NC}"

if command -v python3 &>/dev/null || command -v python &>/dev/null; then
  PYTHON=$(command -v python3 || command -v python)
  cd "$ROOT/ai-service" && $PYTHON -m pip install -r requirements.txt -q 2>/dev/null || true
  $PYTHON -m uvicorn main:app --host 0.0.0.0 --port 8000 & AI_PID=$!
  echo -e "${GREEN}✓ AI service started${NC}"
else
  echo -e "${YELLOW}⚠ Python not found — AI service skipped (mock active)${NC}"
fi

sleep 3
cd "$ROOT/frontend" && npm run dev & FRONTEND_PID=$!
sleep 4

echo ""
echo -e "${BOLD}============================================${NC}"
echo -e "  ${GREEN}Frontend${NC}   →  http://localhost:5173"
echo -e "  ${GREEN}Backend${NC}    →  http://localhost:3001"
echo -e "  ${GREEN}AI Service${NC} →  http://localhost:8000"
echo ""
echo -e "  Demo: demo@roadwatch.ai / demo1234"
echo ""
echo -e "  To load 50 real incidents:"
echo -e "  cd backend && node src/seed.js"
echo -e "${BOLD}============================================${NC}"

# Open browser
sleep 2
command -v xdg-open &>/dev/null && xdg-open http://localhost:5173 &>/dev/null &
command -v open      &>/dev/null && open http://localhost:5173 &

cleanup() { echo "Stopping..."; kill $FRONTEND_PID $BACKEND_PID $AI_PID 2>/dev/null; }
trap cleanup EXIT INT TERM
wait $FRONTEND_PID
