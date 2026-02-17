from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import time
from market import market_engine
from portfolio import portfolio

app = FastAPI(title="MockStock API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background price updater
last_update = time.time()

async def price_updater():
    while True:
        await asyncio.sleep(3)
        market_engine.update_prices()

@app.on_event("startup")
async def startup():
    asyncio.create_task(price_updater())

# --- Market endpoints ---

@app.get("/market")
def get_market():
    return {"stocks": market_engine.get_all()}

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

@app.get("/health")
def health():
    return {"status": "ok"}
