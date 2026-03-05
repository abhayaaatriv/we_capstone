'use client';
import { useState } from 'react';

interface Holding {
  symbol: string;
  shares: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
  weight: number;
}

export default function HoldingsView({ holdings }: { holdings: Holding[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!holdings?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-white/60 font-sans text-sm">
        <div className="text-4xl mb-3 opacity-30">◎</div>
        <p>No holdings yet. Start trading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {holdings.map((h) => {
        const isPositive = h.pnl >= 0;
        const isHov = hovered === h.symbol;

        return (
          <div
            key={h.symbol}
            onMouseEnter={() => setHovered(h.symbol)}
            onMouseLeave={() => setHovered(null)}
            className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-default overflow-hidden ${
              isHov
                ? 'border-white/30 bg-white/5'
                : 'border-white/10 bg-[#0f0f0f]/60'
            }`}
          >
            {/* Weight bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 transition-all ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}
              style={{ width: `${h.weight}%` }}
            />

            {/* Symbol badge */}
            <div
              className={`relative z-10 w-12 h-12 rounded-lg flex items-center justify-center font-sans font-black text-xs tracking-widest flex-shrink-0 ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-red-500/15 text-red-400 border border-red-500/25'
              }`}
            >
              {h.symbol.slice(0, 4)}
            </div>

            {/* Info */}
            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
              <div className="text-white/50 text-xs font-sans font-bold text-sm">{h.symbol}</div>
                <span className="text-white/50 text-xs font-sans">{h.shares.toFixed(4)} shares</span>
              </div>
              <div className="text-white/50 text-xs font-sans mt-0.5">
                avg ${h.avg_price.toFixed(2)} · now ${h.current_price.toFixed(2)}
              </div>
            </div>

            {/* Value */}
            <div className="relative z-10 text-right flex-shrink-0">
              <div className="text-white font-sans font-bold text-sm">${h.market_value.toFixed(2)}</div>
              <div className={`text-xs font-sans font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{h.pnl.toFixed(2)} ({isPositive ? '+' : ''}{h.pnl_pct.toFixed(2)}%)
              </div>
            </div>

            {/* Weight indicator */}
            <div className="relative z-10 flex-shrink-0">
              <div className="text-white/50 text-xs font-sans">{h.weight.toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
