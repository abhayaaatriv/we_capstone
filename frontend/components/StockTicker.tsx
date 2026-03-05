'use client';
import { useEffect, useRef } from 'react';

interface TickerItem {
  symbol: string;
  price: number;
  change_pct: number;
}

export default function StockTicker({ stocks }: { stocks: TickerItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  if (!stocks?.length) return null;

  const items = [...stocks, ...stocks]; // duplicate for seamless loop

  return (
    <div className="overflow-hidden border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
      <div
        ref={ref}
        className="flex whitespace-nowrap animate-ticker"
        style={{ width: 'max-content' }}
      >
        {items.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 py-2 text-xs font-sans">
            <span className="text-[#7effd4] font-bold tracking-widest">{s.symbol}</span>
            <span className="text-white/80">${s.price.toFixed(2)}</span>
            <span className={s.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {s.change_pct >= 0 ? '▲' : '▼'} {Math.abs(s.change_pct).toFixed(2)}%
            </span>
            <span className="text-white/10 mx-2">|</span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
