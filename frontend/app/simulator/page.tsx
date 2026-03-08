"use client";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import TradePanel from "@/components/TradePanel";

const CHALLENGES = {
  beginner: [
    { id: 1, name: "First Trade", desc: "Make your first buy order", xp: 50 },
    { id: 2, name: "Diversifier", desc: "Hold 3 different stocks", xp: 100 },
  ],
  intermediate: [
    { id: 3, name: "Green Portfolio", desc: "Achieve +5% total gain", xp: 200 },
    { id: 4, name: "Active Trader", desc: "Make 5 trades", xp: 150 },
  ],
  expert: [
    {
      id: 5,
      name: "Big Position",
      desc: "Hold a position worth $3,000+",
      xp: 250,
    },
  ],
};

export default function SimulatorPage() {
  const [portfolio, setPortfolio]       = useState<any>(null);
  const [market, setMarket]             = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hello! I'm Finora AI. Ask me anything about trading, your portfolio, or market strategies.",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const message = userInput;

    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setUserInput("");

    try {
      const res = await fetch("/api/finora-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          portfolio,
          market,
          transactions,
        }),
      });

      const data = await res.json();

      setChatMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Finora AI couldn't respond right now." },
      ]);
    }
  };

  const evalChallenges = () => {
    if (!portfolio) return CHALLENGES;

    const evaluate = (list: any[]) =>
      list.map((c) => {
        let done = false;

        if (c.id === 1) done = transactions.length >= 1;
        if (c.id === 2) done = (portfolio.holdings?.length || 0) >= 3;
        if (c.id === 3) done = (portfolio.gain_pct || 0) >= 5;
        if (c.id === 4) done = transactions.length >= 5;
        if (c.id === 5)
          done = portfolio.holdings?.some((h: any) => h.market_value >= 3000);

        return { ...c, done };
      });

    return {
      beginner: evaluate(CHALLENGES.beginner),
      intermediate: evaluate(CHALLENGES.intermediate),
      expert: evaluate(CHALLENGES.expert),
    };
  };

  const challenges = evalChallenges();
  const allChallenges = Object.values(challenges).flat();

  const xpEarned = allChallenges
    .filter((c: any) => c.done)
    .reduce((a: number, c: any) => a + c.xp, 0);

  const xpTotal = allChallenges.reduce((a: number, c: any) => a + c.xp, 0);

  return (
  <div className="flex-1 overflow-auto p-6 space-y-6">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-white font-sans font-black text-2xl uppercase tracking-widest">
          Trading Simulator
        </h1>
        <p className="text-white/40 text-sm font-sans mt-1">
          Learn to trade with zero real risk.
        </p>
      </div>

      <div className="text-right">
        <div className="text-[#7effd4] font-sans font-black text-xl">
          {xpEarned} XP
        </div>
        <div className="text-white/30 text-xs font-sans">
          {xpTotal - xpEarned} XP remaining
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-6">

      {/* Left: Trade Panel + Portfolio */}
      <div className="space-y-4">
        <TradePanel
          stocks={market}
          cash={portfolio?.cash || 0}
          holdings={portfolio?.holdings || []}
          onTrade={fetchAll}
        />

        {portfolio && (
          <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-sans font-bold text-sm uppercase tracking-wide">
              Your Status
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Value",
                  value: `$${portfolio.total_value?.toFixed(2)}`,
                  color: "text-white",
                },
                {
                  label: "P&L",
                  value: `${portfolio.gain >= 0 ? "+" : ""}$${portfolio.gain?.toFixed(2)}`,
                  color:
                    portfolio.gain >= 0
                      ? "text-emerald-400"
                      : "text-red-400",
                },
                {
                  label: "Cash",
                  value: `$${portfolio.cash?.toFixed(2)}`,
                  color: "text-[#7effd4]",
                },
                {
                  label: "Positions",
                  value: portfolio.holdings?.length || 0,
                  color: "text-sky-400",
                },
              ].map((stat, i) => (
                <div key={i} className="bg-[#030a10] rounded-xl p-3">
                  <div className="text-white/30 text-xs font-sans uppercase tracking-widest">
                    {stat.label}
                  </div>
                  <div className={`font-sans font-bold text-lg ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Middle: Challenges */}
      <div className="space-y-4 flex flex-col">

        {/* Challenges */}
        <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-sans font-bold text-sm uppercase tracking-wide">
              Challenges
            </h2>
            <div className="text-[#7effd4] font-sans text-sm font-bold">
              {xpEarned}/{xpTotal} XP
            </div>
          </div>

          <div className="h-2 bg-white/05 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-[#00ffb2] rounded-full transition-all duration-700"
              style={{ width: `${(xpEarned / xpTotal) * 100}%` }}
            />
          </div>

          <div className="space-y-6">
            {Object.entries(challenges).map(([level, list]) => (
              <div key={level}>
                <div className="text-white/40 text-xs font-sans uppercase tracking-widest mb-2">
                  {level}
                </div>

                <div className="space-y-3">
                  {(list as any[]).map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        c.done
                          ? "border-[#00ffb2]/20 bg-[#00ffb2]/05"
                          : "border-white/05 bg-[#030a10]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          c.done
                            ? "bg-[#00ffb2]/20 text-[#00ffb2]"
                            : "bg-white/05 text-white/20"
                        }`}
                      >
                        {c.done ? "✓" : "○"}
                      </div>

                      <div className="flex-1">
                        <div
                          className={`font-sans font-bold text-xs ${
                            c.done ? "text-[#7effd4]" : "text-white/60"
                          }`}
                        >
                          {c.name}
                        </div>
                        <div className="text-white/30 text-[10px] font-sans">
                          {c.desc}
                        </div>
                      </div>

                      <div
                        className={`text-xs font-sans font-bold ${
                          c.done ? "text-[#7effd4]" : "text-white/20"
                        }`}
                      >
                        +{c.xp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

      {/* Right: Finora AI */}
      <div className="h-full">
        <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-[#7effd4]/20 rounded-2xl p-6 h-full flex flex-col">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-[#7effd4]/20 border border-[#7effd4]/40 flex items-center justify-center text-[#7effd4] text-sm font-black">
              F
            </div>
            <span className="text-[#7effd4] font-sans font-bold text-sm uppercase tracking-wide">
              Finora AI
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-[#7effd4]/10 border border-[#7effd4]/20"
                      : "bg-white/05 border border-white/10"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage}>
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about your portfolio..."
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />

              <button
                type="submit"
                className="px-4 py-2 bg-[#7effd4]/20 text-[#7effd4] rounded-lg text-sm font-bold"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);}