"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#030a10] flex items-center justify-center px-6 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ffb2]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ffb2]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            {/* Glowing ring effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00ffb2] to-[#00d4ff] opacity-20 blur-xl animate-pulse" />
            
            {/* Logo container */}
            <div className="relative bg-[#030a10]/80 backdrop-blur-xl border-2 border-[#00ffb2]/30 rounded-full p-6 shadow-[0_0_40px_#00ffb230]">
              <svg
                className="w-16 h-16 text-[#00ffb2]"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M32 8L8 20V44L32 56L56 44V20L32 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-[dash_3s_ease-in-out_infinite]"
                  style={{
                    strokeDasharray: "200",
                    strokeDashoffset: "200",
                  }}
                />
                <path
                  d="M32 20V44M20 26L32 32L44 26M20 38L32 44L44 38"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-60"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="4"
                  fill="currentColor"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mt-6 bg-gradient-to-r from-[#00ffb2] to-[#00d4ff] bg-clip-text text-transparent">
            Finora
          </h1>
          <p className="text-white/40 text-sm mt-2">Mock Trading Simulator</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#030a10]/60 border border-[#00ffb2]/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Welcome Back
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-lg
            hover:bg-white/90 transition shadow-lg flex items-center justify-center gap-3
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-[#050d12] border border-white/10 rounded-lg px-4 py-3 outline-none
              focus:border-[#00ffb2] transition disabled:opacity-50"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-[#050d12] border border-white/10 rounded-lg px-4 py-3 outline-none
              focus:border-[#00ffb2] transition disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#00ffb2] text-black font-semibold py-3 rounded-lg
              hover:opacity-90 transition shadow-[0_0_15px_#00ffb255]
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-white/40 text-sm text-center mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#00ffb2] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 200;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -200;
          }
        }
      `}</style>
    </main>
  );
}
