"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#030a10] flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md bg-[#030a10]/60 border border-[#00ffb2]/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create your account
        </h2>

        {/* Form */}
        <form className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Full Name"
            className="bg-[#050d12] border border-white/10 rounded-lg px-4 py-3 outline-none
            focus:border-[#00ffb2] transition"
          />

          <input
            type="email"
            placeholder="Email"
            className="bg-[#050d12] border border-white/10 rounded-lg px-4 py-3 outline-none
            focus:border-[#00ffb2] transition"
          />

          <input
            type="password"
            placeholder="Password"
            className="bg-[#050d12] border border-white/10 rounded-lg px-4 py-3 outline-none
            focus:border-[#00ffb2] transition"
          />

          <button
            className="mt-2 bg-[#00ffb2] text-black font-semibold py-3 rounded-lg
            hover:opacity-90 transition shadow-[0_0_15px_#00ffb255]"
          >
            Create Account
          </button>
        </form>

        <p className="text-white/40 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ffb2] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
