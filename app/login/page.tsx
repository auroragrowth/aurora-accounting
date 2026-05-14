"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
    else setSent(true);
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
          {sent ? (
            <div className="text-center">
              <h1 className="heading-display text-xl text-brand-blue mb-3">Check your email</h1>
              <p className="text-sm text-brand-ink-soft">
                We've sent a magic link to <strong>{email}</strong>. Click it to sign in. You can close this tab.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="btn-ghost mt-6 mx-auto"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="heading-display text-xl text-brand-blue mb-2">Sign in</h1>
              <p className="text-sm text-brand-ink-soft mb-6">
                Enter your email and we'll send you a magic link. No password required.
              </p>
              <form onSubmit={handleSubmit}>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="you@auroraeventshire.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
