'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import TradePanel from '@/components/TradePanel';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  published: string;
}

const SOURCE_STYLE: Record<string, { dot: string; label: string }> = {
  "CNBC":          { dot: "bg-yellow-400",  label: "text-yellow-400"  },
  "Reuters":       { dot: "bg-orange-400",  label: "text-orange-400"  },
  "Yahoo Finance": { dot: "bg-violet-400",  label: "text-violet-400"  },
  "Finshots":      { dot: "bg-[#00ffb2]",   label: "text-[#7effd4]"   },
};
const DEFAULT_STYLE = { dot: "bg-sky-400", label: "text-sky-400" };

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CHALLENGES = [
  { id: 1, name: 'First Trade',     desc: 'Make your first buy order',       xp: 50  },
  { id: 2, name: 'Diversifier',    desc: 'Hold 3 different stocks',          xp: 100 },
  { id: 3, name: 'Green Portfolio', desc: 'Achieve +5% total gain',          xp: 200 },
  { id: 4, name: 'Day Trader',     desc: 'Make 5 trades in one session',     xp: 150 },
  { id: 5, name: 'Full Send',      desc: 'Hold a position worth $3,000+',    xp: 250 },
];

const AI_RESPONSES = [
  "Based on your portfolio, consider diversifying across different sectors to reduce concentration risk.",
  "Your cash reserves look healthy. This gives you flexibility to capitalize on market dips.",
  "High-volatility stocks can swing 5-10% daily. Size your positions accordingly.",
  "Dollar-cost averaging helps smooth out volatility. Consider regular, smaller purchases over lump sums.",
  "Your P&L shows unrealized gains. Remember, profits aren't locked in until you sell.",
  "Watch your average buy price. If current price < avg price, you're in the red on that position.",
  "Good question! Diversification reduces risk by spreading investments across different assets.",
  "Market timing is difficult. Focus on time in the market rather than timing the market.",
];


export default function SimulatorPage() {
  const [portfolio, setPortfolio]       = useState<any>(null);
  const [market, setMarket]             = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [news, setNews]               = useState<NewsItem[]>([]);
  const [currentNews, setCurrentNews] = useState(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm Finora AI. Ask me anything about trading, your portfolio, or market strategies." }
  ]);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [chatMessages]);

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

  const fetchNews = () => {
    api.getNews(10)
      .then((data: any) => {
        if (data.news?.length) {
          setNews(data.news);
          setNewsUpdatedAt(data.updated_at);
          setCurrentNews(0);
        }
      })
      .catch(() => console.warn('News API unavailable.'))
      .finally(() => setNewsLoading(false));
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', text: userInput }]);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const r = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      setChatMessages(prev => [...prev, { role: 'ai', text: r }]);
    }, 500);

    setUserInput('');
  };

  // Evaluate challenges
  const evalChallenges = () => {
    if (!portfolio) return CHALLENGES.map(c => ({ ...c, done: false }));
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
  const xpEarned   = challenges.filter(c => c.done).reduce((a, c) => a + c.xp, 0);
  const xpTotal    = challenges.reduce((a, c) => a + c.xp, 0);

  const safeItem   = news[currentNews % Math.max(news.length, 1)];
  const sourceStyle = safeItem ? (SOURCE_STYLE[safeItem.source] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

  const formattedUpdatedAt = newsUpdatedAt
    ? new Date(newsUpdatedAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-sans font-black text-2xl uppercase tracking-widest">
            Trading Simulator
          </h1>
          <p className="text-white/40 text-sm font-sans mt-1">Learn to trade with zero real risk.</p>
        </div>
        <div className="text-right">
          <div className="text-[#7effd4] font-sans font-black text-xl">{xpEarned} XP</div>
          <div className="text-white/30 text-xs font-sans">{xpTotal - xpEarned} XP remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Left: Trade Panel + Status ── */}
        <div className="space-y-4">
          <TradePanel
            stocks={market}
            cash={portfolio?.cash || 0}
            holdings={portfolio?.holdings || []}
            onTrade={fetchAll}
          />

          {/* Portfolio snapshot */}
          {portfolio && (
            <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-sans font-bold text-sm uppercase tracking-wide">Your Status</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Value', value: `$${portfolio.total_value?.toFixed(2)}`, color: 'text-white' },
                  { label: 'P&L',         value: `${portfolio.gain >= 0 ? '+' : ''}$${portfolio.gain?.toFixed(2)}`, color: portfolio.gain >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Cash',        value: `$${portfolio.cash?.toFixed(2)}`,         color: 'text-[#7effd4]' },
                  { label: 'Positions',   value: portfolio.holdings?.length || 0,           color: 'text-sky-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#030a10] rounded-xl p-3">
                    <div className="text-white/30 text-xs font-sans uppercase tracking-widest">{stat.label}</div>
                    <div className={`font-sans font-bold text-lg ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Middle: Challenges + Market News ── */}
        <div className="space-y-4 flex flex-col">

          {/* Challenges */}
          <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-sans font-bold text-sm uppercase tracking-wide">Challenges</h2>
              <div className="text-[#7effd4] font-sans text-sm font-bold">{xpEarned}/{xpTotal} XP</div>
            </div>

            {/* XP Progress bar */}
            <div className="h-2 bg-white/05 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-[#00ffb2] rounded-full transition-all duration-700"
                style={{ width: `${(xpEarned / xpTotal) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {challenges.map((c) => (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  c.done ? 'border-[#00ffb2]/20 bg-[#00ffb2]/05' : 'border-white/05 bg-[#030a10]'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                    c.done ? 'bg-[#00ffb2]/20 text-[#00ffb2]' : 'bg-white/05 text-white/20'
                  }`}>
                    {c.done ? '✓' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-sans font-bold text-xs ${c.done ? 'text-[#7effd4]' : 'text-white/60'}`}>{c.name}</div>
                    <div className="text-white/30 text-[10px] font-sans">{c.desc}</div>
                  </div>
                  <div className={`text-xs font-sans font-bold flex-shrink-0 ${c.done ? 'text-[#7effd4]' : 'text-white/20'}`}>
                    +{c.xp}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Market News Panel ── */}
          <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6 flex-1">

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-sans font-bold text-sm uppercase tracking-wide">
                Market News
              </h3>
              {newsLoading ? (
                <span className="text-[10px] text-white/20 font-sans animate-pulse">Loading…</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-[#7effd4]/60 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb2] animate-pulse inline-block" />
                  Live · 30m
                </span>
              )}
            </div>

            {/* Last updated */}
            {formattedUpdatedAt && (
              <p className="text-[10px] text-white/20 font-sans mb-3">
                Updated {formattedUpdatedAt}
              </p>
            )}

            {/* Dot nav */}
            {news.length > 0 && (
              <div className="flex gap-1 mb-4 flex-wrap">
                {news.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentNews(i)}
                    className={`h-1 rounded-full transition-all ${
                      i === currentNews
                        ? 'bg-[#00ffb2] w-4'
                        : 'bg-white/10 w-2'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* News card */}
            {newsLoading && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-white/05 rounded w-3/4" />
                <div className="h-3 bg-white/05 rounded w-full" />
                <div className="h-3 bg-white/05 rounded w-2/3" />
              </div>
            )}

            {!newsLoading && news.length === 0 && (
              <p className="text-white/20 text-xs font-sans">No news available right now.</p>
            )}

            {!newsLoading && safeItem && (
              <div key={currentNews} className="space-y-2" style={{ animation: 'fadeIn 0.3s ease' }}>

                {/* Source + time */}
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sourceStyle.dot}`} />
                  <span className={`text-[10px] font-sans font-semibold uppercase tracking-widest ${sourceStyle.label}`}>
                    {safeItem.source}
                  </span>
                  <span className="text-[10px] text-white/20 font-sans ml-auto">
                    {timeAgo(safeItem.published)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-white font-sans font-bold text-sm leading-snug">
                  {safeItem.title}
                </h4>

                {/* Summary */}
                <p className="text-white/50 text-xs font-sans leading-relaxed">
                  {safeItem.body}
                </p>

                {/* Read more */}
                {safeItem.url !== '#' && (
                  <a
                    href={safeItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[10px] text-white/20 hover:text-[#7effd4]/60 transition-colors mt-1"
                  >
                    Read full story ↗
                  </a>
                )}

                {/* Counter */}
                <div className="text-[10px] text-white/15 font-sans text-right">
                  {currentNews + 1} / {news.length}
                </div>
              </div>
            )}

            {/* Prev / Next */}
            {news.length > 0 && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setCurrentNews(c => (c - 1 + news.length) % news.length)}
                  className="flex-1 py-1.5 text-xs font-sans text-white/30 hover:text-white/60 border border-white/08 rounded transition-all"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentNews(c => (c + 1) % news.length)}
                  className="flex-1 py-1.5 text-xs font-sans text-white/30 hover:text-white/60 border border-white/08 rounded transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Finora AI (unchanged) ── */}
        <div className="h-full">
          {/* Finora AI panel */}
          <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-[#7effd4]/20 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 sticky top-6 z-10">
              <div className="w-7 h-7 rounded-md bg-[#7effd4]/20 border border-[#7effd4]/40 flex items-center justify-center text-[#7effd4] text-sm font-black">F</div>
              <span className="text-[#7effd4] font-sans font-bold text-sm uppercase tracking-wide">Finora AI</span>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded bg-[#7effd4]/20 flex items-center justify-center text-[#7effd4] text-xs font-black flex-shrink-0 mt-1">F</div>
                  )}
                  <div className={`px-3 py-2 rounded-lg text-sm font-sans leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-[#7effd4]/10 text-white border border-[#7effd4]/20'
                      : 'bg-white/05 text-white/80 border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold flex-shrink-0 mt-1">U</div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="border-t border-[#7effd4]/10 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ask about your portfolio..."
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder-white/30 outline-none focus:border-[#7effd4]/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="px-4 py-2.5 bg-[#7effd4]/20 hover:bg-[#7effd4]/30 disabled:bg-white/5 disabled:text-white/20 text-[#7effd4] font-sans font-bold text-sm rounded-lg transition-all disabled:cursor-not-allowed border border-[#7effd4]/20"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
