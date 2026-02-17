import random
import math
from datetime import datetime, timedelta
from typing import Dict, List

STOCKS = {
    "AAPL": {"name": "Apple Inc.", "base_price": 189.50, "volatility": 0.015, "sector": "Technology"},
    "TSLA": {"name": "Tesla Inc.", "base_price": 245.80, "volatility": 0.035, "sector": "Automotive"},
    "NVDA": {"name": "NVIDIA Corp.", "base_price": 875.20, "volatility": 0.028, "sector": "Semiconductors"},
    "AMZN": {"name": "Amazon.com", "base_price": 178.90, "volatility": 0.018, "sector": "E-Commerce"},
    "META": {"name": "Meta Platforms", "base_price": 512.30, "volatility": 0.022, "sector": "Social Media"},
    "FINX": {"name": "Finora Exchange", "base_price": 45.60, "volatility": 0.045, "sector": "FinTech"},
    "QNTM": {"name": "Quantum Systems", "base_price": 128.40, "volatility": 0.055, "sector": "Quantum Tech"},
    "ASTRA": {"name": "AstraVentures", "base_price": 67.20, "volatility": 0.040, "sector": "Space Tech"},
    "VEST": {"name": "Vestal Capital", "base_price": 34.80, "volatility": 0.030, "sector": "Finance"},
    "MOCK": {"name": "Mockchain Labs", "base_price": 89.10, "volatility": 0.060, "sector": "Blockchain"},
}

class MarketEngine:
    def __init__(self):
        self.prices: Dict[str, float] = {}
        self.history: Dict[str, List[dict]] = {}
        self.trends: Dict[str, float] = {}
        self._initialize()

    def _initialize(self):
        now = datetime.now()
        for symbol, info in STOCKS.items():
            self.prices[symbol] = info["base_price"]
            self.trends[symbol] = random.uniform(-0.001, 0.001)
            # Generate 100 historical points
            history = []
            price = info["base_price"] * random.uniform(0.7, 0.9)
            for i in range(100):
                ts = now - timedelta(minutes=(100 - i) * 5)
                price = price * (1 + random.normalvariate(0.0005, info["volatility"] * 0.5))
                price = max(price, 0.01)
                history.append({
                    "timestamp": ts.isoformat(),
                    "price": round(price, 2),
                    "volume": random.randint(1000, 50000)
                })
            # Bridge to current price
            self.prices[symbol] = round(history[-1]["price"], 2)
            self.history[symbol] = history

    def update_prices(self):
        now = datetime.now()
        for symbol, info in STOCKS.items():
            vol = info["volatility"]
            # Drift towards mean with random walk
            drift = self.trends[symbol]
            shock = random.normalvariate(0, vol)
            change = drift + shock
            self.prices[symbol] = round(self.prices[symbol] * (1 + change), 2)
            self.prices[symbol] = max(self.prices[symbol], 1.0)
            
            # Occasionally flip trend
            if random.random() < 0.05:
                self.trends[symbol] = random.uniform(-0.002, 0.002)
            
            self.history[symbol].append({
                "timestamp": now.isoformat(),
                "price": self.prices[symbol],
                "volume": random.randint(500, 30000)
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
