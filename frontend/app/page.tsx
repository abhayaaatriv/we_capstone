"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6 bg-[#030a10] text-white">
      <div className="flex flex-col items-center text-center max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
          The <span className="text-[#00ffb2]">Future</span> of
          <br />
          Mock Stock Trading
        </h2>

        <p className="text-white/40 mt-6">
          Practice trading with $10,000 virtual cash, analyze live market
          movements, and sharpen your investment strategies with Finora.
        </p>

        {/* Buttons */}
        <div className="flex gap-6 mt-12">
          <Link href="/login">
            <button
              className="px-8 py-3 rounded-xl border border-[#00ffb2]/30
              text-[#00ffb2] bg-[#00ffb2]/10
              hover:bg-[#00ffb2]/20 transition-all"
            >
              Login
            </button>
          </Link>

          <Link href="/register">
            <button
              className="px-8 py-3 rounded-xl bg-[#00ffb2]
              text-black font-semibold
              hover:opacity-90 transition
              shadow-[0_0_18px_#00ffb255]"
            >
              Register
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
