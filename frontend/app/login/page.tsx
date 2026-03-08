"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Login to your account
        </h2>

        {/* Form */}
        <form className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            className="bg-[#050d12] border border-[var(--border)] rounded-lg px-4 py-3 outline-none
            focus:border-[var(--accent)] transition"
          />

          <input
            type="password"
            placeholder="Password"
            className="bg-[#050d12] border border-[var(--border)] rounded-lg px-4 py-3 outline-none
            focus:border-[var(--accent)] transition"
          />

          <button
            className="mt-2 bg-[var(--accent)] text-black font-semibold py-3 rounded-lg
            hover:opacity-90 transition shadow-[0_0_12px_var(--accent-dim)]"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm text-center mt-6">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--accent)] hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
