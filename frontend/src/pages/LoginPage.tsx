import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api/client";
import { getHomeForRole, redirectPathForRole } from "../config/roleRoutes";
import { SanctuaryMesh } from "../components/sanctuary/SanctuaryMesh";
import { useAuthStore, type AppRole } from "../store/authStore";

const DEMO_ACCOUNTS = [
  { email: "user@ethio.dev", password: "user123", label: "Personal · Your Space", role: "user" as AppRole },
  { email: "hr@ethio.dev", password: "hr123", label: "HR · Workplace", role: "hr" as AppRole },
  { email: "doctor@ethio.dev", password: "doc123", label: "Doctor · Clinical", role: "doctor" as AppRole },
];

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const authLogin = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  async function submit(e: FormEvent, creds?: { email: string; password: string }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const em = creds?.email ?? email;
    const pw = creds?.password ?? password;
    try {
      const res = await apiLogin(em, pw);
      const profile = res.user as { email: string; role: AppRole; name: string };
      authLogin(res.access_token, profile);
      const dest = redirectPathForRole(profile.role, getHomeForRole(profile.role));
      navigate(dest, { replace: true });
    } catch {
      setError("Invalid email or password. Try a demo account below.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sanctuary-page relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <SanctuaryMesh />
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-medium leading-snug text-ink md:text-4xl">
            Breathe in calm,
            <br />
            <span className="text-teal">breathe out clarity</span>
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Ethio-Vitality AI · wellness built for Ethiopia
          </p>
        </div>

        <div className="glass-card">
          <h1 className="font-display text-xl font-medium text-ink">Welcome</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your sanctuary</p>

          <form onSubmit={(e) => submit(e)} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                required
              />
            </div>
            {error && <p className="text-sm text-ink">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Signing in…" : "Begin your journey"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">Demo accounts</p>
          <div className="mt-2 space-y-2">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={(e) => submit(e, { email: d.email, password: d.password })}
                className="w-full rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-left text-sm transition hover:bg-teal-light/50"
              >
                <span className="font-medium text-ink">{d.label}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
