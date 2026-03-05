'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StockChartProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  high: number;
  low: number;
  history: { timestamp: string; price: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1929] border border-[#0ff2]/20 rounded-lg px-3 py-2 text-xs font-sans">
      <p className="text-[#7effd4]">${payload[0].value.toFixed(2)}</p>
      <p className="text-white/60">{payload[0].payload.time}</p>
    </div>
  );
};

export default function StockChart({ symbol, name, price, change, change_pct, high, low, history }: StockChartProps) {
  const isPositive = change_pct >= 0;
  const color = isPositive ? '#00ffb2' : '#ff4d6d';

  const data = history.map((h) => ({
    price: h.price,
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-sans font-black text-2xl text-white tracking-widest">{symbol}</div>
          <div className="text-white/60 text-sm font-sans">{name}</div>
        </div>
        <div className="text-right">
          <div className="font-sans font-bold text-2xl text-white">${price.toFixed(2)}</div>
          <div className={`text-sm font-sans font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{change_pct.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-[#0ff2]/05">
        <div>
          <div className="text-white/50 text-xs font-sans uppercase tracking-widest">High</div>
          <div className="text-white font-sans font-bold">${high.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-white/50 text-xs font-sans uppercase tracking-widest">Low</div>
          <div className="text-white font-sans font-bold">${low.toFixed(2)}</div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad_${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="time" tick={{ fill: '#ffffff40', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#ffffff40', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(0)}`} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#grad_${symbol})`} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
