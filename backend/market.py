import random
import os
from datetime import datetime, timedelta
from typing import Dict, List

# Optional: Use real market quotes from NSE (Indian stock exchange) when installed.
# Set USE_NSETOOLS=1 in the environment to enable.
USE_NSETOOLS = os.getenv("USE_NSETOOLS", "0").strip().lower() in ("1", "true", "yes")

try:
    from nsetools import Nse

    _nse = Nse()
except ImportError:
    _nse = None

# If NSETools is enabled, we default to a set of popular NSE symbols.
# Otherwise we fall back to a simulated market.
STOCKS = {
    "RELIANCE": {"name": "Reliance Industries", "base_price": 2500.00, "volatility": 0.020, "sector": "Energy"},
    "TCS": {"name": "TCS", "base_price": 3600.00, "volatility": 0.018, "sector": "Technology"},
    "INFY": {"name": "Infosys", "base_price": 1520.00, "volatility": 0.017, "sector": "Technology"},
    "HDFCBANK": {"name": "HDFC Bank", "base_price": 1600.00, "volatility": 0.019, "sector": "Financial"},
    "ICICIBANK": {"name": "ICICI Bank", "base_price": 900.00, "volatility": 0.022, "sector": "Financial"},
    "LT": {"name": "Larsen & Toubro", "base_price": 3200.00, "volatility": 0.021, "sector": "Industrials"},
    "HINDUNILVR": {"name": "Hindustan Unilever", "base_price": 2600.00, "volatility": 0.015, "sector": "Consumer"},
    "BHARTIARTL": {"name": "Bharti Airtel", "base_price": 850.00, "volatility": 0.023, "sector": "Telecom"},
    "AXISBANK": {"name": "Axis Bank", "base_price": 1000.00, "volatility": 0.022, "sector": "Financial"},
    "JSWSTEEL": {"name": "JSW Steel", "base_price": 750.00, "volatility": 0.030, "sector": "Materials"},
}

# Fallback to the original mock stocks if NSETools is unavailable or disabled
if USE_NSETOOLS and _nse is None:
    print("[WARN] NSETools requested but not installed; falling back to simulated market.")
    USE_NSETOOLS = False

class MarketEngine:
    def __init__(self):
        self.prices: Dict[str, float] = {}
        self.history: Dict[str, List[dict]] = {}
        self.trends: Dict[str, float] = {}
        self._initialize()

    def _initialize(self):
        now = datetime.now()
        for symbol, info in STOCKS.items():
            # If NSETools is enabled, fetch live price; otherwise fall back to base_price
            if USE_NSETOOLS:
                try:
                    quote = _nse.get_quote(symbol)
                    price = float(quote.get("lastPrice") or quote.get("closePrice") or info["base_price"])
                except Exception:
                    price = info["base_price"]
            else:
                price = info["base_price"]

            self.prices[symbol] = price
            self.trends[symbol] = random.uniform(-0.001, 0.001)

            # Generate 100 historical points (random walk anchored at the current price)
            history = []
            base = price * random.uniform(0.85, 0.95)
            for i in range(100):
                ts = now - timedelta(minutes=(100 - i) * 5)
                base = base * (1 + random.normalvariate(0.0005, info["volatility"] * 0.5))
                base = max(base, 0.01)
                history.append({
                    "timestamp": ts.isoformat(),
                    "price": round(base, 2),
                    "volume": random.randint(1000, 50000),
                })

            # Ensure history ends at the current price (especially for NSE mode)
            history[-1]["price"] = round(self.prices[symbol], 2)
            self.prices[symbol] = round(self.prices[symbol], 2)
            self.history[symbol] = history

    def update_prices(self):
        now = datetime.now()
        for symbol, info in STOCKS.items():
            if USE_NSETOOLS:
                try:
                    quote = _nse.get_quote(symbol)
                    new_price = float(quote.get("lastPrice") or quote.get("closePrice") or self.prices[symbol])
                    self.prices[symbol] = max(new_price, 1.0)
                except Exception:
                    # Fall back to simulated random walk if NSE fetch fails
                    new_price = self.prices[symbol]
                    vol = info["volatility"]
                    drift = self.trends[symbol]
                    shock = random.normalvariate(0, vol)
                    change = drift + shock
                    self.prices[symbol] = round(new_price * (1 + change), 2)
            else:
                vol = info["volatility"]
                drift = self.trends[symbol]
                shock = random.normalvariate(0, vol)
                change = drift + shock
                self.prices[symbol] = round(self.prices[symbol] * (1 + change), 2)

            self.prices[symbol] = max(self.prices[symbol], 1.0)

            # Occasionally flip trend when using simulated mode
            if not USE_NSETOOLS and random.random() < 0.05:
                self.trends[symbol] = random.uniform(-0.002, 0.002)

            self.history[symbol].append({
                "timestamp": now.isoformat(),
                "price": self.prices[symbol],
                "volume": random.randint(500, 30000),
            })
            # Keep last 200 points
            if len(self.history[symbol]) > 200:
                self.history[symbol] = self.history[symbol][-200:]

    def get_all(self):
        result = []
        for symbol, info in STOCKS.items():
            hist = self.history[symbol]
            prev_price = hist[-2]["price"] if len(hist) >= 2 else hist[-1]["price"]
            current = self.prices[symbol]
            change = current - prev_price
            change_pct = (change / prev_price) * 100
            result.append({
                "symbol": symbol,
                "name": info["name"],
                "sector": info["sector"],
                "price": current,
                "change": round(change, 2),
                "change_pct": round(change_pct, 3),
                "volatility": info["volatility"],
                "volume": self.history[symbol][-1]["volume"] if self.history[symbol] else 0,
            })
        return result

    def get_symbol(self, symbol: str):
        if symbol not in STOCKS:
            return None
        info = STOCKS[symbol]
        hist = self.history[symbol]
        prev_price = hist[-2]["price"] if len(hist) >= 2 else hist[-1]["price"]
        current = self.prices[symbol]
        change = current - prev_price
        change_pct = (change / prev_price) * 100
        # Day stats
        prices_today = [h["price"] for h in hist[-50:]]
        return {
            "symbol": symbol,
            "name": info["name"],
            "sector": info["sector"],
            "price": current,
            "change": round(change, 2),
            "change_pct": round(change_pct, 3),
            "high": round(max(prices_today), 2),
            "low": round(min(prices_today), 2),
            "volatility": info["volatility"],
            "history": hist[-100:],
        }

market_engine = MarketEngine()
