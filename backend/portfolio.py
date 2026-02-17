from typing import Dict, List, Optional
from datetime import datetime

STARTING_CASH = 10000.0

class Portfolio:
    def __init__(self):
        self.cash: float = STARTING_CASH
        self.holdings: Dict[str, dict] = {}
        self.transactions: List[dict] = []
        self.portfolio_history: List[dict] = []

    def get_holding(self, symbol: str) -> Optional[dict]:
        return self.holdings.get(symbol)

    def buy(self, symbol: str, shares: float, price: float) -> dict:
        cost = shares * price
        if cost > self.cash:
            raise ValueError(f"Insufficient cash. Need ${cost:.2f}, have ${self.cash:.2f}")
        if shares <= 0:
            raise ValueError("Shares must be positive")

        self.cash -= cost
        if symbol in self.holdings:
            existing = self.holdings[symbol]
            total_shares = existing["shares"] + shares
            avg_price = ((existing["shares"] * existing["avg_price"]) + cost) / total_shares
            self.holdings[symbol] = {
                "shares": round(total_shares, 6),
                "avg_price": round(avg_price, 4),
            }
        else:
            self.holdings[symbol] = {
                "shares": round(shares, 6),
                "avg_price": round(price, 4),
            }

        tx = {
            "id": len(self.transactions) + 1,
            "type": "BUY",
            "symbol": symbol,
            "shares": shares,
            "price": price,
            "total": round(cost, 2),
            "timestamp": datetime.now().isoformat(),
        }
        self.transactions.append(tx)
        return tx

    def sell(self, symbol: str, shares: float, price: float) -> dict:
        if symbol not in self.holdings:
            raise ValueError(f"No holdings in {symbol}")
        holding = self.holdings[symbol]
        if shares > holding["shares"]:
            raise ValueError(f"Cannot sell {shares} shares, only own {holding['shares']:.4f}")
        if shares <= 0:
            raise ValueError("Shares must be positive")

        proceeds = shares * price
        self.cash += proceeds

        remaining = holding["shares"] - shares
        if remaining < 0.0001:
            del self.holdings[symbol]
        else:
            self.holdings[symbol]["shares"] = round(remaining, 6)

        tx = {
            "id": len(self.transactions) + 1,
            "type": "SELL",
            "symbol": symbol,
            "shares": shares,
            "price": price,
            "total": round(proceeds, 2),
            "timestamp": datetime.now().isoformat(),
        }
        self.transactions.append(tx)
        return tx

    def get_value(self, current_prices: Dict[str, float]) -> dict:
        holdings_value = sum(
            self.holdings[sym]["shares"] * current_prices.get(sym, 0)
            for sym in self.holdings
        )
        total_value = self.cash + holdings_value
        
        # Track portfolio history
        self.portfolio_history.append({
            "timestamp": datetime.now().isoformat(),
            "total_value": round(total_value, 2),
        })
        if len(self.portfolio_history) > 500:
            self.portfolio_history = self.portfolio_history[-500:]

        gain = total_value - STARTING_CASH
        gain_pct = (gain / STARTING_CASH) * 100

        holdings_detail = []
        for sym, h in self.holdings.items():
            current_price = current_prices.get(sym, 0)
            market_value = h["shares"] * current_price
            cost_basis = h["shares"] * h["avg_price"]
            pnl = market_value - cost_basis
            pnl_pct = (pnl / cost_basis * 100) if cost_basis > 0 else 0
            holdings_detail.append({
                "symbol": sym,
                "shares": h["shares"],
                "avg_price": h["avg_price"],
                "current_price": round(current_price, 2),
                "market_value": round(market_value, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 3),
                "weight": round((market_value / total_value * 100) if total_value > 0 else 0, 2),
            })

        return {
            "cash": round(self.cash, 2),
            "holdings_value": round(holdings_value, 2),
            "total_value": round(total_value, 2),
            "gain": round(gain, 2),
            "gain_pct": round(gain_pct, 3),
            "holdings": sorted(holdings_detail, key=lambda x: x["market_value"], reverse=True),
            "portfolio_history": self.portfolio_history[-100:],
        }

portfolio = Portfolio()
