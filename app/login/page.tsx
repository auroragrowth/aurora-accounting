"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-cream">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="w-14 h-14 bg-brand-orange rounded-xl grid place-items-center text-white heading-display text-3xl shadow-[0_2px_0_rgba(0,0,0,0.15)]">A</div>
          <div>
            <div className="heading-display text-2xl text-brand-blue leading-none">AURORA EVENTS</div>
            <div className="text-xs tracking-widest text-brand-ink-soft mt-1">BOOKKEEPING</div>
          </div>
        </div>

        <div className="bg-white border border-brand-line rounded-2xl p-8 shadow-sm">
          {magicSent ? (
            <div className="text-center">
              <h1 className="heading-display text-xl text-brand-blue mb-3">Check your email</h1>
              <p className="text-sm text-brand-ink-soft">
                Magic link sent to <strong>{email}</strong>. Click it to sign in.
              </p>
              <button
                onClick={() => { setMagicSent(false); setMode("password"); }}
                className="btn-ghost mt-6 mx-auto"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === "password" ? (
            <>
              <h1 className="heading-display text-xl text-brand-blue mb-2">Sign in</h1>
              <p className="text-sm text-brand-ink-soft mb-6">
                Enter your email and password to access the bookkeeping app.
              </p>
              <form onSubmit={handlePasswordSubmit}>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
                <label className="label mt-4">Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {error && (
                  <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="btn-primary mt-5 w-full justify-center"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button
                  onClick={() => { setMode("magic"); setError(null); }}
                  className="text-xs text-brand-ink-soft hover:text-brand-blue underline"
                >
                  Email me a one-time login link instead
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="heading-display text-xl text-brand-blue mb-2">Magic link sign in</h1>
              <p className="text-sm text-brand-ink-soft mb-6">
                We'll email you a one-time login link — no password needed.
              </p>
              <form onSubmit={handleMagicSubmit}>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
                {error && (
                  <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-primary mt-5 w-full justify-center"
                >
                  {loading ? "Sending..." : "Send magic link"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button
                  onClick={() => { setMode("password"); setError(null); }}
                  className="text-xs text-brand-ink-soft hover:text-brand-blue underline"
                >
                  Sign in with password instead
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
