'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import StockTicker from '@/components/StockTicker';
import PortfolioChart from '@/components/PortfolioChart';
import TradePanel from '@/components/TradePanel';
import HoldingsView from '@/components/HoldingsView';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [market, setMarket] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [p, m, t] = await Promise.all([
      api.getPortfolio(),
      api.getMarket(),
      api.getTransactions(),
    ]);
    setPortfolio(p);
    setMarket(m.stocks || []);
    setTransactions(t.transactions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3500);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const isPositive = (portfolio?.gain_pct || 0) >= 0;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <StockTicker stocks={market} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4">
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
            : [
                {
                  label: 'Portfolio Value',
                  value: `$${portfolio?.total_value?.toFixed(2) || '0.00'}`,
                  sub: portfolio
                    ? `${isPositive ? '+' : ''}${portfolio.gain_pct?.toFixed(2)}% all time`
                    : '',
                  color: isPositive ? 'text-emerald-400' : 'text-red-400',
                },
                {
                  label: 'Cash Balance',
                  value: `$${portfolio?.cash?.toFixed(2) || '0.00'}`,
                  sub: `${((portfolio?.cash / portfolio?.total_value) * 100 || 0).toFixed(1)}% of portfolio`,
                  color: 'text-[#7effd4]',
                },
                {
                  label: 'Invested',
                  value: `$${portfolio?.holdings_value?.toFixed(2) || '0.00'}`,
                  sub: `${portfolio?.holdings?.length || 0} positions`,
                  color: 'text-sky-400',
                },
                {
                  label: 'P&L',
                  value: `${isPositive ? '+' : ''}$${portfolio?.gain?.toFixed(2) || '0.00'}`,
                  sub: 'vs. $10,000 start',
                  color: isPositive ? 'text-emerald-400' : 'text-red-400',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#050d12] border border-[#0ff2]/08 rounded-xl p-4 space-y-1 hover:border-[#0ff2]/20 transition-all"
                >
                  <div className="text-white/30 text-xs font-mono uppercase tracking-widest">{stat.label}</div>
                  <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/30 text-xs font-mono">{stat.sub}</div>
                </div>
              ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Portfolio chart */}
          <div className="col-span-2 space-y-4">
            <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-mono font-bold text-sm uppercase tracking-widest">Portfolio Performance</h2>
                <div className={`text-xs font-mono px-2 py-1 rounded ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(portfolio?.gain_pct || 0).toFixed(2)}%
                </div>
              </div>
              <div className="h-52">
                {loading ? (
                  <div className="skeleton h-full rounded-xl" />
                ) : (
                  <PortfolioChart
                    data={portfolio?.portfolio_history || []}
                    totalValue={portfolio?.total_value || 10000}
                    gainPct={portfolio?.gain_pct || 0}
                  />
                )}
              </div>
            </div>

            {/* Holdings */}
            <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5">
              <h2 className="text-white font-mono font-bold text-sm uppercase tracking-widest mb-4">Holdings</h2>
              {loading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : (
                <HoldingsView holdings={portfolio?.holdings || []} />
              )}
            </div>
          </div>

          {/* Trade panel + transactions */}
          <div className="space-y-4">
            {loading ? (
              <div className="skeleton h-96 rounded-2xl" />
            ) : (
              <TradePanel
                stocks={market}
                cash={portfolio?.cash || 0}
                holdings={portfolio?.holdings || []}
                onTrade={fetchAll}
              />
            )}

            {/* Recent transactions */}
            <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5">
              <h3 className="text-white font-mono font-bold text-xs uppercase tracking-widest mb-3">Recent Trades</h3>
              {transactions.length === 0 ? (
                <div className="text-white/20 text-xs font-mono text-center py-4">No trades yet</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-white/05">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="text-white/70">{tx.symbol}</span>
                        <span className="text-white/30">{tx.shares.toFixed(3)}x</span>
                      </div>
                      <span className="text-white/50">${tx.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
