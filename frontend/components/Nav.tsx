"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StockTicker from "./StockTicker";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/market", label: "Market", icon: "◎" },
  { href: "/simulator", label: "Simulator", icon: "◇" },
  { href: "/news", label: "News", icon: "▶" },
];

interface NavProps {
  stocks?: any[];
}

export default function Nav({ stocks }: NavProps) {
  const path = usePathname();

  const isPublicPage =
    path === "/" || path?.startsWith("/login") || path?.startsWith("/register");

  const showTicker =
    !!stocks &&
    (path?.startsWith("/dashboard") ||
      path?.startsWith("/market") ||
      path?.startsWith("/simulator") ||
      path?.startsWith("/news"));

  return (
    <div className="sticky top-0 z-50">
      <nav className="flex items-center px-6 py-4 border-b border-[#0ff2]/08 bg-[#030a10]/90 backdrop-blur-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#00ffb2]/20 border border-[#00ffb2]/40 flex items-center justify-center text-[#00ffb2] text-xs font-black">
            F
          </div>
          <span className="font-sans font-black text-white tracking-widest text-sm">
            FINORA
          </span>
        </Link>

        {/* Navigation (only after login pages) */}
        {!isPublicPage && (
          <div className="flex-1 flex items-center justify-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  path?.startsWith(n.href)
                    ? "bg-[#00ffb2]/10 text-[#00ffb2] border border-[#00ffb2]/25"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="text-base">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/30 text-xs font-sans">LIVE</span>
        </div>
      </nav>

      {/* Stock ticker only on core trading pages */}
      {showTicker && <StockTicker stocks={stocks} />}
    </div>
  );
}
