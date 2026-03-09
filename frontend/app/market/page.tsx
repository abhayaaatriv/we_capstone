'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import StockChart from '@/components/StockChart';

export default function MarketPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [stockDetail, setStockDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search to avoid sending too many requests
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  // Reset paging when the search term changes
  useEffect(() => {
    setStocks([]);
    setOffset(0);
    setHasMore(true);
  }, [debouncedSearch]);

  // Keep selected stock in sync with the currently loaded list
  useEffect(() => {
    if (!stocks.length) return;
    if (!selected || !stocks.some((s) => s.symbol === selected)) {
      setSelected(stocks[0].symbol);
    }
  }, [stocks, selected]);

  useEffect(() => {
    const fetchMarket = async (pageOffset: number) => {
      const m = await api.getMarket(debouncedSearch, 50, pageOffset);
      const incoming = m.stocks || [];

      setHasMore(incoming.length >= 50);
      setLoading(false);

      setStocks((prev) => {
        if (pageOffset === 0) {
          // Merge updated top page with any previously loaded pages.
          const existingMap = Object.fromEntries(prev.map((s) => [s.symbol, s]));
          incoming.forEach((item: any) => {
            existingMap[item.symbol] = item;
          });
          const merged = [...incoming];
          for (const item of prev) {
            if (!incoming.some((i: { symbol: any; }) => i.symbol === item.symbol)) {
              merged.push(item);
            }
          }
          return merged;
        }

        return [...prev, ...incoming];
      });
    };

    fetchMarket(0);
    const interval = setInterval(() => fetchMarket(0), 3500);
    return () => clearInterval(interval);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!selected) return;
    const fetch = async () => {
      const d = await api.getStock(selected);
      setStockDetail(d);
    };
    fetch();
    const interval = setInterval(fetch, 3500);
    return () => clearInterval(interval);
  }, [selected]);

  const loadMore = async () => {
    if (!hasMore) return;
    setLoading(true);
    const nextOffset = offset + 50;
    const m = await api.getMarket(debouncedSearch, 50, nextOffset);
    const incoming = m.stocks || [];
    setStocks((prev) => [...prev, ...incoming]);
    setOffset(nextOffset);
    setHasMore(incoming.length >= 50);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Stock grid */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white font-sans font-black text-lg uppercase tracking-widest">Live Market</h1>
              <div className="flex items-center gap-2 text-xs font-sans text-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Updates every 3s
              </div>
            </div>

            <div className="mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by symbol or name"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {loading && !stocks.length ? (
              <div className="grid grid-cols-2 gap-3">
                {Array(10).fill(0).map((_, i: number) => (
                  <div key={i} className="skeleton h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {stocks.map((s) => {
                    const isPos = s.change_pct >= 0;
                    const isSel = selected === s.symbol;

                    const borderColor = isPos
                      ? 'border-emerald-400/20'
                      : 'border-red-400/20';

                    const bgStyle = isSel
                      ? 'bg-[#00ffb2]/05'
                      : `bg-gradient-to-b ${isPos ? 'from-emerald-400/20' : 'from-red-400/20'} to-[#0f0f0f]`;

                    return (
                      <button
                        key={s.symbol}
                        onClick={() => setSelected(s.symbol)}
                        className={`text-left p-4 rounded-xl border ${borderColor} transition-all hover:scale-[1.01] active:scale-[0.99] ${bgStyle}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-white font-sans font-black text-sm tracking-widest">
                              {s.symbol}
                            </div>
                            <div className="text-white/30 text-xs font-sans truncate max-w-32">
                              {s.name}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-sans px-1.5 py-0.5 rounded tracking-wider ${
                              isPos
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {s.sector}
                          </span>
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="font-sans font-bold text-xl text-white">
                            ${s.price.toFixed(2)}
                          </div>

                          <div
                            className={`text-sm font-sans font-bold ${
                              isPos ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {s.change_pct.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={loadMore}
                      className="px-5 py-2 rounded-xl border border-white/20 text-xs font-sans font-bold text-white/70 hover:text-white/90 hover:border-white/30 transition"
                    >
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selected stock chart */}
          <div>
            {selected && stockDetail ? (
              <StockChart {...stockDetail} />
            ) : (
              <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center h-64 text-center">
                <div className="text-4xl opacity-20 mb-3">◎</div>
                <div className="text-white/30 text-sm font-sans">Click a stock to view its chart</div>
              </div>
            )}

            {/* Market heatmap */}
            <div className="mt-4 bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-sans font-bold text-xs uppercase tracking-widest mb-3">Sentiment</h3>
              <div className="grid grid-cols-2 gap-2">
                {stocks.map((s) => {
                  const isPos = s.change_pct >= 0;
                  const intensity = Math.min(Math.abs(s.change_pct) / 3, 1);
                  return (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                      style={{
                        background: isPos
                          ? `rgba(0, 255, 178, ${0.05 + intensity * 0.15})`
                          : `rgba(255, 77, 109, ${0.05 + intensity * 0.15})`,
                      }}
                    >
                      <span className="font-sans font-bold text-xs text-white/80">{s.symbol}</span>
                      <span className={`font-sans text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? '+' : ''}{s.change_pct.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
