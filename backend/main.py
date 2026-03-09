from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pathlib import Path
import json
import asyncio
import os
import time
from typing import Optional

from market import market_engine
from portfolio import portfolio

NEWS_FILE = Path(__file__).parent.parent / "frontend" / "public" / "news.json"

app = FastAPI(title="MockStock API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background price updater
# When using live NSE quotes, update interval is increased to avoid hitting API limits.
UPDATE_INTERVAL = int(os.getenv("PRICE_UPDATE_INTERVAL", "3"))

async def price_updater():
    while True:
        await asyncio.sleep(UPDATE_INTERVAL)
        market_engine.update_prices()

@app.on_event("startup")
async def startup():
    asyncio.create_task(price_updater())

# --- Market endpoints ---

@app.get("/market")
def get_market(q: Optional[str] = None, limit: int = 25, offset: int = 0):
    """Get market data.

    - q: optional search query (symbol or name)
    - limit: maximum number of results
    - offset: pagination offset
    """
    return {"stocks": market_engine.get_all(q=q, limit=limit, offset=offset)}

@app.get("/market/{symbol}")
def get_stock(symbol: str):
    data = market_engine.get_symbol(symbol.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    return data

# --- Portfolio endpoints ---

@app.get("/portfolio")
def get_portfolio():
    prices = {s["symbol"]: s["price"] for s in market_engine.get_all()}
    return portfolio.get_value(prices)

@app.get("/transactions")
def get_transactions():
    return {"transactions": list(reversed(portfolio.transactions))}

# --- Trade endpoints ---

class TradeRequest(BaseModel):
    symbol: str
    shares: float

@app.post("/trade/buy")
def buy_stock(req: TradeRequest):
    symbol = req.symbol.upper()
    stock = market_engine.get_symbol(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    try:
        tx = portfolio.buy(symbol, req.shares, stock["price"])
        prices = {s["symbol"]: s["price"] for s in market_engine.get_all()}
        port = portfolio.get_value(prices)
        return {"transaction": tx, "portfolio": port}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/trade/sell")
def sell_stock(req: TradeRequest):
    symbol = req.symbol.upper()
    stock = market_engine.get_symbol(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    try:
        tx = portfolio.sell(symbol, req.shares, stock["price"])
        prices = {s["symbol"]: s["price"] for s in market_engine.get_all()}
        port = portfolio.get_value(prices)
        return {"transaction": tx, "portfolio": port}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- News endpoint ---

@app.get("/api/news")
def get_news(limit: int = 25):
    if not NEWS_FILE.exists():
        return JSONResponse({"updated_at": None, "count": 0, "news": []})
    data = json.loads(NEWS_FILE.read_text())
    news = data.get("news", [])[:limit]
    return JSONResponse({"updated_at": data["updated_at"], "count": len(news), "news": news})

# --- Health endpoint ---

@app.get("/health")
def health():
    return {"status": "ok"}
