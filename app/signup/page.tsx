"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function StrengthBar({ password }: { password: string }) {
  const s = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const labels = ["", "Weak", "Fair", "Strong"];
  const colors = ["", "#f43f5e", "#f59e0b", "#10b981"];
  if (!password) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="str-bar"
            style={{ background: i <= s ? colors[s] : "rgba(255,255,255,.07)" }} />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: colors[s], minWidth: "40px" }}>
        {labels[s]}
      </span>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Signup failed");
      else router.push("/login?registered=true");
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--c-bg)" }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className={`text-center mb-8 ${mounted ? "anim-in" : "opacity-0"}`}>
          <div className="logo-hover inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 cursor-default"
            style={{ background: "var(--grad-main)", boxShadow: "0 8px 32px rgba(99,102,241,.4)" }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">TaskBoard</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--c-muted)" }}>Create your free account</p>
        </div>

        <div className={`auth-card ${mounted ? "anim-in delay-1" : "opacity-0"}`}>
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(244,63,94,.1)", border: "1px solid rgba(244,63,94,.25)", color: "#fb7185" }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                Name <span style={{ color: "var(--c-dim)", textTransform: "none", fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Doe" className="inp" autoComplete="name" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="inp" autoComplete="email" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                Password
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required minLength={6}
                  className="inp pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-70"
                  style={{ color: "var(--c-muted)" }}>
                  {showPw
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <StrengthBar password={password} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading
                ? <><svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account...</>
                : "Create account →"}
            </button>
          </form>

          <div className="relative z-10 mt-6 pt-5 text-center text-sm"
            style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#818cf8" }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
