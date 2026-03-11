"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  published: string;
}

const SOURCE_STYLE: Record<string, { dot: string; label: string; border: string }> = {
  CNBC: { dot: "bg-yellow-400", label: "text-yellow-300", border: "border-yellow-400/20" },
  Reuters: { dot: "bg-orange-400", label: "text-orange-300", border: "border-orange-400/20" },
  "Yahoo Finance": { dot: "bg-violet-400", label: "text-violet-300", border: "border-violet-400/20" },
  Finshots: { dot: "bg-[#00ffb2]", label: "text-[#7effd4]", border: "border-[#00ffb2]/20" },
};

const DEFAULT_STYLE = {
  dot: "bg-sky-400",
  label: "text-sky-300",
  border: "border-sky-400/20",
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setError(null);
      const data = await api.getNews(25);
      setNews(data.news || []);
      setUpdatedAt(data.updated_at || null);
    } catch {
      setError("Could not load market news right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sources = useMemo(() => {
    const set = new Set(news.map((n) => n.source).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [news]);

  const featured = news[0];
  const list = news.slice(1);

  const formattedUpdatedAt = updatedAt
    ? new Date(updatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-sans font-black text-2xl uppercase tracking-widest">
            Market News
          </h1>
          <p className="text-white/40 text-sm font-sans mt-1">
            Live headlines, source tags, and quick read summaries.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[#7effd4] font-sans font-bold text-sm">Live Feed</div>
          <div className="text-white/30 text-xs font-sans">
            {formattedUpdatedAt ? `Updated ${formattedUpdatedAt}` : "Waiting for update"}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-white/40 text-xs font-sans">
            Showing latest stories from all sources
          </div>

          <button
            onClick={fetchNews}
            className="px-3 py-1.5 rounded-lg text-xs font-sans border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
              ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm font-sans">
          {error}
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-8 text-center text-white/40 text-sm font-sans">
          No stories available right now.
        </div>
      )}

      {!loading && !error && featured && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article
            className={`xl:col-span-2 bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border rounded-2xl p-6 ${
              SOURCE_STYLE[featured.source]?.border || DEFAULT_STYLE.border
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2 h-2 rounded-full ${SOURCE_STYLE[featured.source]?.dot || DEFAULT_STYLE.dot}`}
              />
              <span
                className={`text-[11px] font-sans font-semibold uppercase tracking-widest ${
                  SOURCE_STYLE[featured.source]?.label || DEFAULT_STYLE.label
                }`}
              >
                {featured.source || "Unknown Source"}
              </span>
              <span className="text-[11px] text-white/20 ml-auto font-sans">
                {timeAgo(featured.published)}
              </span>
            </div>

            <h2 className="text-white font-sans font-bold text-2xl leading-tight mb-3">
              {featured.title}
            </h2>

            <p className="text-white/60 text-sm leading-relaxed font-sans mb-4">
              {featured.body}
            </p>

            {featured.url && featured.url !== "#" && (
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-sans text-[#7effd4]/80 hover:text-[#7effd4] transition-colors"
              >
                Read full story
              </a>
            )}
          </article>

          <aside className="bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-sans font-bold text-xs uppercase tracking-widest mb-4">
              News Pulse
            </h3>
            <div className="space-y-3">
              {sources.slice(1).map((source) => {
                const count = news.filter((n) => n.source === source).length;
                const style = SOURCE_STYLE[source] || DEFAULT_STYLE;
                return (
                  <div key={source} className="flex items-center justify-between bg-[#030a10] border border-white/5 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className={`text-xs font-sans ${style.label}`}>{source}</span>
                    </div>
                    <span className="text-xs text-white/40 font-sans">{count}</span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((item) => {
            const style = SOURCE_STYLE[item.source] || DEFAULT_STYLE;
            return (
              <article
                key={item.id}
                className={`bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] border rounded-xl p-4 ${style.border}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className={`text-[10px] font-sans font-semibold uppercase tracking-widest ${style.label}`}>
                    {item.source || "Unknown Source"}
                  </span>
                  <span className="text-[10px] text-white/20 ml-auto font-sans">
                    {timeAgo(item.published)}
                  </span>
                </div>

                <h3 className="text-white font-sans font-bold text-sm leading-snug mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-white/50 text-xs font-sans leading-relaxed mb-3 line-clamp-3">
                  {item.body}
                </p>

                {item.url && item.url !== "#" && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-sans text-white/40 hover:text-[#7effd4]/80 transition-colors"
                  >
                    Open source
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
