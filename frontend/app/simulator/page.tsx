'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import TradePanel from '@/components/TradePanel';

const TIPS = [
  {
    icon: '◈',
    title: 'Diversify your portfolio',
    body: "Don't put all your cash in one stock. Spread investments across sectors to reduce risk.",
    level: 'Beginner',
  },
  {
    icon: '◎',
    title: 'Understand volatility',
    body: 'High-volatility stocks like QNTM and MOCK can move 5-10% in a single day. High risk = high reward.',
    level: 'Beginner',
  },
  {
    icon: '◇',
    title: 'Dollar-cost averaging',
    body: 'Buy a fixed dollar amount regularly instead of timing the market. Reduces the impact of volatility.',
    level: 'Intermediate',
  },
  {
    icon: '▲',
    title: 'Watch your cash reserves',
    body: 'Always keep some cash available. Buying opportunities appear when markets dip.',
    level: 'Beginner',
  },
  {
    icon: '⬡',
    title: 'P&L tracking',
    body: 'Your P&L (Profit & Loss) shows unrealized gains. Shares only lock in value when you sell.',
    level: 'Beginner',
  },
  {
    icon: '◉',
    title: 'Sector rotation',
    body: 'Different sectors perform differently in different economic conditions. Tech vs Finance vs Space.',
    level: 'Intermediate',
  },
];

const CHALLENGES = [
  { id: 1, name: 'First Trade', desc: 'Make your first buy order', xp: 50, done: false },
  { id: 2, name: 'Diversifier', desc: 'Hold 3 different stocks', xp: 100, done: false },
  { id: 3, name: 'Green Portfolio', desc: 'Achieve +5% total gain', xp: 200, done: false },
  { id: 4, name: 'Day Trader', desc: 'Make 5 trades in one session', xp: 150, done: false },
  { id: 5, name: 'Full Send', desc: 'Hold a position worth $3,000+', xp: 250, done: false },
];

const FINORA_THOUGHTS = [
  "The market is a device for transferring money from the impatient to the patient.",
  "Risk comes from not knowing what you're doing. Learn before you leap.",
  "Diversification is protection against ignorance. It makes little sense for those who know what they're doing.",
  "QNTM and MOCK have high volatility — great for learning, dangerous for large positions.",
  "Your cash allocation (% in cash) affects how quickly you can respond to dips.",
  "Average buy price is key. If the stock dips below your avg, you're in the red.",
];

export default function SimulatorPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [market, setMarket] = useState<any[]>([]);
  const [currentTip, setCurrentTip] = useState(0);
  const [currentThought, setCurrentThought] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchAll = async () => {
    const [p, m, t] = await Promise.all([
      api.getPortfolio(),
      api.getMarket(),
      api.getTransactions(),
    ]);
    setPortfolio(p);
    setMarket(m.stocks || []);
    setTransactions(t.transactions || []);
  };

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setCurrentThought((c) => (c + 1) % FINORA_THOUGHTS.length);
    }, 8000);
    return () => clearInterval(i);
  }, []);

  // Evaluate challenges
  const evalChallenges = () => {
    if (!portfolio) return CHALLENGES;
    return CHALLENGES.map((c) => {
      let done = false;
      if (c.id === 1) done = transactions.length >= 1;
      if (c.id === 2) done = (portfolio.holdings?.length || 0) >= 3;
      if (c.id === 3) done = (portfolio.gain_pct || 0) >= 5;
      if (c.id === 4) done = transactions.length >= 5;
      if (c.id === 5) done = portfolio.holdings?.some((h: any) => h.market_value >= 3000);
      return { ...c, done };
    });
  };

  const challenges = evalChallenges();
  const xpEarned = challenges.filter((c) => c.done).reduce((a, c) => a + c.xp, 0);
  const xpTotal = challenges.reduce((a, c) => a + c.xp, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-mono font-black text-2xl uppercase tracking-widest">
            Trading Simulator
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">Learn to trade with zero real risk.</p>
        </div>
        <div className="text-right">
          <div className="text-[#7effd4] font-mono font-black text-xl">{xpEarned} XP</div>
          <div className="text-white/30 text-xs font-mono">{xpTotal - xpEarned} XP remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Trade + AI */}
        <div className="space-y-4">
          <TradePanel
            stocks={market}
            cash={portfolio?.cash || 0}
            holdings={portfolio?.holdings || []}
            onTrade={fetchAll}
          />

          {/* Finora AI panel */}
          <div className="bg-[#050d12] border border-[#7effd4]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#7effd4]/20 border border-[#7effd4]/40 flex items-center justify-center text-[#7effd4] text-xs font-black">
                F
              </div>
              <span className="text-[#7effd4] font-mono font-bold text-xs uppercase tracking-widest">Ask Finora AI</span>
              <span className="text-[#7effd4]/40 text-[10px] font-mono ml-auto">Placeholder</span>
            </div>
            <div
              key={currentThought}
              className="text-white/60 text-xs font-mono leading-relaxed italic"
              style={{ animation: 'fadeIn 0.5s ease' }}
            >
              "{FINORA_THOUGHTS[currentThought]}"
            </div>
            <div className="mt-3 pt-3 border-t border-[#7effd4]/10">
              <input
                type="text"
                placeholder="Ask about your portfolio..."
                className="w-full bg-transparent text-xs font-mono text-white/40 placeholder-white/20 outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Middle: Tips */}
        <div className="space-y-4">
          <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5">
            <h2 className="text-white font-mono font-bold text-xs uppercase tracking-widest mb-4">Trading Tips</h2>
            <div className="flex gap-2 mb-4">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTip(i)}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    i === currentTip ? 'bg-[#00ffb2]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div
              key={currentTip}
              className="space-y-3"
              style={{ animation: 'fadeIn 0.3s ease' }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl text-[#7effd4]">{TIPS[currentTip].icon}</div>
                <div>
                  <div className="text-white font-mono font-bold text-sm">{TIPS[currentTip].title}</div>
                  <div
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-block ${
                      TIPS[currentTip].level === 'Beginner'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-sky-500/10 text-sky-400'
                    }`}
                  >
                    {TIPS[currentTip].level}
                  </div>
                </div>
              </div>
              <p className="text-white/50 text-xs font-mono leading-relaxed">{TIPS[currentTip].body}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setCurrentTip((c) => (c - 1 + TIPS.length) % TIPS.length)}
                className="flex-1 py-2 text-xs font-mono text-white/30 hover:text-white/60 border border-white/08 rounded-lg transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentTip((c) => (c + 1) % TIPS.length)}
                className="flex-1 py-2 text-xs font-mono text-white/30 hover:text-white/60 border border-white/08 rounded-lg transition-all"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Portfolio snapshot */}
          {portfolio && (
            <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-mono font-bold text-xs uppercase tracking-widest">Your Status</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Value', value: `$${portfolio.total_value?.toFixed(2)}`, color: 'text-white' },
                  { label: 'P&L', value: `${portfolio.gain >= 0 ? '+' : ''}$${portfolio.gain?.toFixed(2)}`, color: portfolio.gain >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Cash', value: `$${portfolio.cash?.toFixed(2)}`, color: 'text-[#7effd4]' },
                  { label: 'Positions', value: portfolio.holdings?.length || 0, color: 'text-sky-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#030a10] rounded-xl p-3">
                    <div className="text-white/30 text-[10px] font-mono uppercase tracking-widest">{stat.label}</div>
                    <div className={`font-mono font-bold text-base ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Challenges */}
        <div>
          <div className="bg-[#050d12] border border-[#0ff2]/08 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-mono font-bold text-xs uppercase tracking-widest">Challenges</h2>
              <div className="text-[#7effd4] font-mono text-xs font-bold">{xpEarned}/{xpTotal} XP</div>
            </div>

            {/* XP Progress bar */}
            <div className="h-1.5 bg-white/05 rounded-full mb-5 overflow-hidden">
              <div
                className="h-full bg-[#00ffb2] rounded-full transition-all duration-700"
                style={{ width: `${(xpEarned / xpTotal) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    c.done
                      ? 'border-[#00ffb2]/20 bg-[#00ffb2]/05'
                      : 'border-white/05 bg-[#030a10]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      c.done
                        ? 'bg-[#00ffb2]/20 text-[#00ffb2]'
                        : 'bg-white/05 text-white/20'
                    }`}
                  >
                    {c.done ? '✓' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono font-bold text-xs ${c.done ? 'text-[#7effd4]' : 'text-white/60'}`}>
                      {c.name}
                    </div>
                    <div className="text-white/30 text-[10px] font-mono">{c.desc}</div>
                  </div>
                  <div className={`text-xs font-mono font-bold flex-shrink-0 ${c.done ? 'text-[#7effd4]' : 'text-white/20'}`}>
                    +{c.xp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
