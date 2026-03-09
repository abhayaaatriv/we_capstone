# 🚀 Finora — Mock Stock Trading Simulator

A futuristic finance OS-style virtual trading simulator. Start with $10,000 virtual cash and trade 10 simulated stocks in a live market.

## 📁 Structure

```
mock-stock-sim/
  frontend/          ← Next.js 14 app (TypeScript + Tailwind + Recharts)
  backend/           ← FastAPI server (Python)
  start.sh           ← Launch both services
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- pip

### Optional: Load the full NSE symbol universe
If you want access to the full NSE universe (not just the built-in demo stocks), you can fetch the latest symbol list via `nsetools`.

```bash
cd backend
pip install -r requirements.txt
python scripts/fetch_nse_symbols.py
```

The backend will cache the symbol list in `backend/nse_symbols.json` and use it when `USE_NSETOOLS=1`.

### Option 1: Run with the start script

```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## 🌐 Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Portfolio overview, live prices, buy/sell |
| Market | `/market` | All stocks with live charts |
| Simulator | `/simulator` | Beginner mode with tips & challenges |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/market` | All stock prices (supports `?q=` search, `limit`, `offset`) |
| GET | `/market/{symbol}` | Single stock + history |
| GET | `/portfolio` | Cash, holdings, P&L |
| GET | `/transactions` | Trade history |
| POST | `/trade/buy` | Buy shares |
| POST | `/trade/sell` | Sell shares |

## 🎮 Features

- **10 simulated stocks** with unique volatility profiles
- **Live price updates** every 3 seconds (random walk algorithm)
- **Buy/sell system** with validation (insufficient cash, over-selling)
- **Portfolio tracking** with P&L, chart history
- **Market page** with live heatmap and per-stock charts
- **Simulator mode** with tips, challenges & XP system
- **Finora AI** placeholder chat panel
- **Dark finance OS aesthetic** with cursor glow, grid background

## 🏦 Stocks

| Symbol | Name | Volatility | Sector |
|--------|------|-----------|--------|
| AAPL | Apple Inc. | Low | Technology |
| TSLA | Tesla Inc. | Med-High | Automotive |
| NVDA | NVIDIA Corp. | Medium | Semiconductors |
| AMZN | Amazon.com | Low-Med | E-Commerce |
| META | Meta Platforms | Medium | Social Media |
| FINX | Finora Exchange | High | FinTech |
| QNTM | Quantum Systems | Very High | Quantum Tech |
| ASTRA | AstraVentures | High | Space Tech |
| VEST | Vestal Capital | Med-High | Finance |
| MOCK | Mockchain Labs | Very High | Blockchain |

## 🧠 Extending with AI

The Finora AI panel in `/simulator` is a placeholder. To wire it up:
1. Add an endpoint `POST /ai/advice` in `backend/main.py`
2. Integrate Llama or any LLM with portfolio context
3. Update the chat component in `simulator/page.tsx`
