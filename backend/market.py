import json
import random
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

NSE_SYMBOLS_PATH = Path(__file__).parent / "nse_symbols.json"

# Optional: Use real market quotes from NSE (Indian stock exchange) when installed.
# Set USE_NSETOOLS=1 in the environment to enable.
USE_NSETOOLS = os.getenv("USE_NSETOOLS", "0").strip().lower() in ("1", "true", "yes")

try:
    from nsetools import Nse
    _NSE_CLASS = Nse
except ImportError:
    _NSE_CLASS = None

# Internal helper to lazily instantiate the Nse client.
# This avoids requiring NSE access on import and prevents crashes.

_nse = None

def _make_nse():
    """Return an Nse client, or None if it cannot be created."""
    global _nse
    if _nse is not None:
        return _nse

    if _NSE_CLASS is None:
        return None

    try:
        _nse = _NSE_CLASS()
        return _nse
    except Exception:
        _nse = None
        return None

# Fallback to a small simulated stock universe if NSETools is unavailable.
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

DEFAULT_VOLATILITY = 0.02
DEFAULT_SECTOR = "Unknown"

# If nsetools is missing, NSE mode will simply fall back to simulated market.
# (We avoid failing startup; errors are logged only when attempting live fetch.)
if USE_NSETOOLS and _NSE_CLASS is None:
    print("[WARN] USE_NSETOOLS=1 but nsetools is not installed; using simulated market.")
    USE_NSETOOLS = False


class MarketEngine:
    def __init__(self):
        self.prices: Dict[str, float] = {}
        self.history: Dict[str, List[dict]] = {}
        self.trends: Dict[str, float] = {}

        # In newer nsetools versions, get_stock_codes() returns a list of symbols.
        self._nse_symbols: List[str] = []
        self._tracked_symbols: set[str] = set()

        self._initialize()

    def _initialize(self):
        now = datetime.now()

        # Load NSE symbols for searching/search suggestions. This is useful even when we
        # aren't fetching live quotes (e.g., when USE_NSETOOLS is unset or nsetools isn't installed).
        self._load_nse_stock_codes()

        # Seed the market with the default stocks
        for symbol, info in STOCKS.items():
            self._initialize_symbol(symbol, info["name"], info["base_price"], info["volatility"], info["sector"], now)

        # If we have a cached NSE symbol universe, initialize a subset for display.
        # We don't want to initialize every symbol (it would be slow), but having a
        # few extra helps the UI show more than just the hardcoded stocks.
        if self._nse_symbols:
            for symbol in self._nse_symbols[:30]:
                if symbol in self._tracked_symbols:
                    continue
                self._initialize_symbol(symbol, symbol, base_price=100.0, volatility=DEFAULT_VOLATILITY, sector=DEFAULT_SECTOR, now=now)

    def _load_nse_stock_codes(self):
        # Prefer a cached list when available (offline / rate-limited scenarios)
        if NSE_SYMBOLS_PATH.exists():
            try:
                data = json.loads(NSE_SYMBOLS_PATH.read_text())
                if isinstance(data, list):
                    self._nse_symbols = data
                    return
            except Exception:
                pass

        # If we are not configured to use nsetools, do not attempt network calls.
        if not USE_NSETOOLS:
            self._nse_symbols = []
            return

        try:
            nse = _make_nse()
            if nse is None:
                raise RuntimeError("NSE client not available")

            codes = nse.get_stock_codes()
            # In newer nsetools versions, we get a list of symbols.
            if isinstance(codes, list):
                self._nse_symbols = sorted(set(codes))
            elif isinstance(codes, dict):
                # Older versions returned a dict.
                self._nse_symbols = sorted(k for k in codes.keys() if k != "SYMBOL")
            else:
                self._nse_symbols = []

            # Cache for offline/quick startup.
            try:
                NSE_SYMBOLS_PATH.write_text(json.dumps(self._nse_symbols, indent=2, ensure_ascii=False))
            except Exception:
                pass
        except Exception as e:
            print(f"[WARN] Unable to load NSE symbol list: {e}")
            self._nse_symbols = []

    def _get_quote(self, symbol: str) -> Optional[dict]:
        if not USE_NSETOOLS:
            return None
        try:
            nse = _make_nse()
            if nse is None:
                return None
            return nse.get_quote(symbol)
        except Exception:
            return None

    def _initialize_symbol(
        self,
        symbol: str,
        name: str,
        base_price: float,
        volatility: float,
        sector: str,
        now: Optional[datetime] = None,
    ):
        now = now or datetime.now()
        # If we already created this symbol, skip.
        if symbol in self.prices:
            return

        price = base_price
        if USE_NSETOOLS:
            quote = self._get_quote(symbol)
            if quote:
                price = float(quote.get("lastPrice") or quote.get("closePrice") or price)

        self.prices[symbol] = round(price, 2)
        self.trends[symbol] = random.uniform(-0.001, 0.001)
        self._tracked_symbols.add(symbol)

        # Generate 100 historical points (random walk anchored at the current price)
        history: List[dict] = []
        base = price * random.uniform(0.85, 0.95)
        for i in range(100):
            ts = now - timedelta(minutes=(100 - i) * 5)
            base = base * (1 + random.normalvariate(0.0005, volatility * 0.5))
            base = max(base, 0.01)
            history.append({
                "timestamp": ts.isoformat(),
                "price": round(base, 2),
                "volume": random.randint(1000, 50000),
            })

        # Ensure history ends at the current price.
        history[-1]["price"] = round(self.prices[symbol], 2)
        self.history[symbol] = history

    def update_prices(self):
        now = datetime.now()

        for symbol in list(self._tracked_symbols):
            info = STOCKS.get(symbol, {})
            vol = info.get("volatility", DEFAULT_VOLATILITY)

            if USE_NSETOOLS:
                quote = self._get_quote(symbol)
                if quote:
                    new_price = float(quote.get("lastPrice") or quote.get("closePrice") or self.prices.get(symbol, 1.0))
                    self.prices[symbol] = max(new_price, 1.0)
                else:
                    # fall back to simulated walk if quote fails
                    new_price = self.prices.get(symbol, 1.0)
                    drift = self.trends.get(symbol, 0)
                    shock = random.normalvariate(0, vol)
                    change = drift + shock
                    self.prices[symbol] = round(new_price * (1 + change), 2)
            else:
                drift = self.trends.get(symbol, 0)
                shock = random.normalvariate(0, vol)
                change = drift + shock
                self.prices[symbol] = round(self.prices.get(symbol, 1.0) * (1 + change), 2)

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

    def _build_market_item(self, symbol: str, name: str, sector: str, volatility: float) -> dict:
        if symbol not in self.history:
            # Initialize symbol if it was not seen before
            self._initialize_symbol(symbol, name, base_price=100.0, volatility=volatility, sector=sector)

        hist = self.history[symbol]
        prev_price = hist[-2]["price"] if len(hist) >= 2 else hist[-1]["price"]
        current = self.prices[symbol]
        change = current - prev_price
        change_pct = (change / prev_price) * 100 if prev_price != 0 else 0

        return {
            "symbol": symbol,
            "name": name,
            "sector": sector,
            "price": current,
            "change": round(change, 2),
            "change_pct": round(change_pct, 3),
            "volatility": volatility,
            "volume": self.history[symbol][-1]["volume"] if self.history[symbol] else 0,
        }

    def _search(self, q: str, limit: int, offset: int):
        """Search across the available symbol universe."""
        q_norm = q.strip().upper()
        results: list[tuple[str, str]] = []

        # First, search the built-in stock universe
        for symbol, info in STOCKS.items():
            name = info.get("name", "")
            if q_norm in symbol or q_norm in name.upper():
                results.append((symbol, name))
                if len(results) >= offset + limit:
                    break

        # If we have NSE code list, search there too
        if len(results) < offset + limit and self._nse_symbols:
            for symbol in self._nse_symbols:
                if symbol in STOCKS:
                    continue
                if q_norm in symbol:
                    results.append((symbol, symbol))
                    if len(results) >= offset + limit:
                        break

        results = results[offset : offset + limit]
        return [self._build_market_item(sym, nm, DEFAULT_SECTOR, DEFAULT_VOLATILITY) for sym, nm in results]

    def get_all(self, q: Optional[str] = None, limit: int = 25, offset: int = 0):
        """Return a page of market data.

        If a query is provided, this will search across the available market universe.
        """
        if q:
            return self._search(q, limit, offset)

        # Default behavior: return a page from the market universe.
        # Include both the core simulated stocks and the cached NSE symbol list when available.
        symbols: List[str] = []
        # Core stock universe first
        for symbol in STOCKS.keys():
            symbols.append(symbol)
            if len(symbols) >= offset + limit:
                break

        # Append cached NSE symbol universe (if available)
        for symbol in self._nse_symbols:
            if symbol in symbols:
                continue
            symbols.append(symbol)
            if len(symbols) >= offset + limit:
                break

        symbols = symbols[offset : offset + limit]
        return [
            self._build_market_item(
                symbol,
                STOCKS.get(symbol, {}).get("name", symbol),
                STOCKS.get(symbol, {}).get("sector", DEFAULT_SECTOR),
                STOCKS.get(symbol, {}).get("volatility", DEFAULT_VOLATILITY),
            )
            for symbol in symbols
        ]

    def get_symbol(self, symbol: str):
        """Return detailed data for a single symbol."""
        symbol = symbol.upper()

        # Allow selecting any symbol from the cached NSE universe, even when we are not
        # fetching live NSE quotes (USE_NSETOOLS=false).
        if symbol in self._nse_symbols:
            name = symbol
            self._initialize_symbol(symbol, name, base_price=100.0, volatility=DEFAULT_VOLATILITY, sector=DEFAULT_SECTOR)
        elif symbol in STOCKS:
            name = STOCKS[symbol]["name"]
        else:
            return None

        # Ensure we have a fresh price for NSE symbols
        if USE_NSETOOLS:
            quote = self._get_quote(symbol)
            if quote:
                self.prices[symbol] = round(float(quote.get("lastPrice") or quote.get("closePrice") or self.prices.get(symbol, 1.0)), 2)

        hist = self.history[symbol]
        prev_price = hist[-2]["price"] if len(hist) >= 2 else hist[-1]["price"]
        current = self.prices[symbol]
        change = current - prev_price
        change_pct = (change / prev_price) * 100 if prev_price != 0 else 0
        prices_today = [h["price"] for h in hist[-100:]]

        return {
            "symbol": symbol,
            "name": name,
            "sector": STOCKS.get(symbol, {}).get("sector", DEFAULT_SECTOR),
            "price": current,
            "change": round(change, 2),
            "change_pct": round(change_pct, 3),
            "high": round(max(prices_today), 2),
            "low": round(min(prices_today), 2),
            "volatility": STOCKS.get(symbol, {}).get("volatility", DEFAULT_VOLATILITY),
            "history": hist[-100:],
        }


market_engine = MarketEngine()
