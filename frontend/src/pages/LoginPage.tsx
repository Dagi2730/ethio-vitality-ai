import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { checkBackendHealth, login as apiLogin, signup as apiSignup } from "../api/client";
import { getHomeForRole, redirectPathForRole } from "../config/roleRoutes";
import { SanctuaryMesh } from "../components/sanctuary/SanctuaryMesh";
import { useAuthStore, type AppRole } from "../store/authStore";

// @ts-ignore
const DEMO_ACCOUNTS = [
  { email: "user@ethio.dev", password: "user123", label: "Personal · Your Space", role: "user" as AppRole },
  { email: "hr@ethio.dev", password: "hr123", label: "HR · Workplace", role: "hr" as AppRole },
  { email: "doctor@ethio.dev", password: "doc123", label: "Doctor · Clinical", role: "doctor" as AppRole },
];

type Mode = "login" | "signup";

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const authLogin = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const [mode, setMode] = useState<Mode>("login");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("General");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendOk).catch(() => setBackendOk(false));
    const id = setInterval(() => {
      checkBackendHealth().then(setBackendOk).catch(() => setBackendOk(false));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (isAuthenticated && user) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  async function completeAuth(res: Awaited<ReturnType<typeof apiLogin>>) {
    const role = res.user.role as AppRole;
    authLogin(res.access_token, {
      email: res.user.email,
      role,
      name: res.user.name,
      user_id: res.user.user_id,
      department: res.user.department,
    });
    const dest = redirectPathForRole(role, getHomeForRole(role));
    navigate(dest, { replace: true });
  }

  async function submit(e: FormEvent, creds?: { email: string; password: string }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    logout();
    
    const em = (creds?.email ?? email).trim().toLowerCase();
    const pw = creds?.password ?? password;
    
    try {
      if (mode === "signup" && !creds) {
        const res = await apiSignup(em, pw, name, department);
        await completeAuth(res);
      } else {
        const res = await apiLogin(em, pw);
        await completeAuth(res);
      }
    } catch (err) {
      setError("Authentication failed. Please check your credentials or API connection.");
      console.error("Auth error:", err);
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
          <div className="flex gap-2 rounded-2xl bg-white/50 p-1">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${mode === "login" ? "bg-teal text-white" : "text-ink-muted"}`}>Sign in</button>
            <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${mode === "signup" ? "bg-teal text-white" : "text-ink-muted"}`}>Sign up</button>
          </div>

          <h1 className="mt-4 font-display text-xl font-medium text-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          
          {backendOk === false && <p className="mt-2 text-xs text-amber-600">Note: Connection to server is currently unstable.</p>}

          <form onSubmit={(e) => submit(e)} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Department</label>
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40" />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-ink-muted">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40" required />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "signup" ? 8 : 4} className="mt-1 w-full rounded-2xl border border-warm-border bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal/40" required />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? "Processing..." : mode === "signup" ? "Create account" : "Begin your journey"}</button>
          </form>

          {mode === "login" && (
            <div className="mt-6 space-y-2">
              <p className="text-center text-xs text-ink-muted">Demo accounts</p>
              {DEMO_ACCOUNTS.map((d) => (
                <button key={d.email} type="button" onClick={(e) => submit(e, { email: d.email, password: d.password })} className="w-full rounded-2xl border border-white/60 bg-white/50 px-4 py-2 text-left text-xs">
                  <span className="font-medium text-ink">{d.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}