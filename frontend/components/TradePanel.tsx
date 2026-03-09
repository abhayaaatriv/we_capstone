'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
}

interface TradePanelProps {
  stocks: Stock[];
  cash: number;
  holdings: { symbol: string; shares: number }[];
  onTrade: () => void;
}

export default function TradePanel({ stocks, cash, holdings, onTrade }: TradePanelProps) {
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('AAPL');
  const [search, setSearch] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);

  const visibleStocks = search.trim() ? searchResults : stocks;

  const selectedStock = visibleStocks.find((s) => s.symbol === symbol);
  const sharesNum = parseFloat(shares) || 0;
  const total = sharesNum * (selectedStock?.price || 0);
  const holding = holdings.find((h) => h.symbol === symbol);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.getMarket(search.trim(), 50);
        setSearchResults(res.stocks || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (visibleStocks.length === 0) return;
    if (!visibleStocks.some((s) => s.symbol === symbol)) {
      setSymbol(visibleStocks[0].symbol);
    }
  }, [visibleStocks, symbol]);

  const handleTrade = async () => {
    if (!sharesNum || sharesNum <= 0) return;
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'BUY') {
        await api.buy(symbol, sharesNum);
        setMessage({ text: `Bought ${sharesNum} shares of ${symbol}`, ok: true });
      } else {
        await api.sell(symbol, sharesNum);
        setMessage({ text: `Sold ${sharesNum} shares of ${symbol}`, ok: true });
      }
      setShares('');
      onTrade();
    } catch (e: any) {
      setMessage({ text: e.message, ok: false });
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold tracking-wide font-sans text-sm uppercase">Execute Trade</h3>
        <div className="flex rounded-lg overflow-hidden border border-white/20">
          {(['BUY', 'SELL'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs font-sans font-bold tracking-widest transition-all ${
                mode === m
                  ? m === 'BUY'
                    ? 'bg-[#00ffb2]/20 text-[#00ffb2]'
                    : 'bg-red-500/20 text-red-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol Select */}
      <div className="space-y-1.5">
        <label className="text-xs text-white font-sans uppercase tracking-widest">Search</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type symbol or company name"
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-white/40 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white font-sans uppercase tracking-widest">Symbol</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-white/40 transition-colors"
        >
          {visibleStocks.map((s) => (
            <option key={s.symbol} value={s.symbol} className="bg-[#0f0f0f]">
              {s.symbol} — ${s.price.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Shares Input */}
      <div className="space-y-1.5">
        <label className="text-xs text-white font-sans uppercase tracking-widest">Shares</label>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          min="0.001"
          step="0.001"
          placeholder="0.00"
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-white/40 transition-colors placeholder-white/20"
        />
      </div>

      {/* Info rows */}
      <div className="space-y-2 py-3 border-t border-white/05">
        <div className="flex justify-between text-xs font-sans">
          <span className="text-white/70">Price per share</span>
          <span className="text-white/70">${selectedStock?.price.toFixed(2) || '—'}</span>
        </div>
        <div className="flex justify-between text-xs font-sans">
          <span className="text-white/70">Total cost</span>
          <span className={`font-bold ${sharesNum > 0 ? 'text-[#7effd4]' : 'text-white/30'}`}>
            ${total.toFixed(2)}
          </span>
        </div>
        {mode === 'BUY' && (
          <div className="flex justify-between text-xs font-sans">
            <span className="text-white/70">Available cash</span>
            <span className={total > cash ? 'text-red-400' : 'text-white/70'}>${cash.toFixed(2)}</span>
          </div>
        )}
        {mode === 'SELL' && holding && (
          <div className="flex justify-between text-xs font-sans">
            <span className="text-white/70">You own</span>
            <span className="text-white/70">{holding.shares.toFixed(4)} shares</span>
          </div>
        )}
      </div>

      {/* Execute button */}
      <button
        onClick={handleTrade}
        disabled={loading || !sharesNum || sharesNum <= 0}
        className={`w-full py-3 rounded-xl font-sans font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
          mode === 'BUY'
            ? 'bg-[#00ffb2]/40 hover:bg-[#00ffb2]/60 text-[#00ffb2] border border-[#00ffb2]/30 hover:border-[#00ffb2]/60'
            : 'bg-red-500/40 hover:bg-red-500/60 text-red-400 border border-red-500/30 hover:border-red-500/60'
        }`}
      >
        {loading ? 'Processing...' : `${mode} ${symbol}`}
      </button>

      {message && (
        <div
          className={`text-xs font-sans text-center py-2 rounded-lg ${
            message.ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
