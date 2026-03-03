'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/market', label: 'Market', icon: '◎' },
  { href: '/simulator', label: 'Simulator', icon: '◇' },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="flex items-center gap-1 px-6 py-4 border-b border-[#0ff2]/08 bg-[#030a10]/90 backdrop-blur-xl">
      <Link href="/dashboard" className="mr-8 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[#00ffb2]/20 border border-[#00ffb2]/40 flex items-center justify-center text-[#00ffb2] text-xs font-black">
          F
        </div>
        <span className="font-mono font-black text-white tracking-widest text-sm">FINORA</span>
        <span className="text-[#00ffb2]/60 text-xs font-mono">BETA</span>
      </Link>

      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all ${
            path?.startsWith(n.href)
              ? 'bg-[#00ffb2]/10 text-[#00ffb2] border border-[#00ffb2]/25'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <span className="text-sm">{n.icon}</span>
          {n.label}
        </Link>
      ))}

      <div className="ml-auto flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white/30 text-xs font-mono">LIVE</span>
      </div>
    </nav>
  );
}
