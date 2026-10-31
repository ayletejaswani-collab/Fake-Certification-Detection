import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import HashDecode from "../components/HashDecode";
import ScanEnter from "../components/ScanEnter";

const demos = [
  ["Registrar", "admin@alits.edu", "ALITS@2026"],
  ["Issuer", "issuer@alits.edu", "Issuer@2026"],
  ["Student", "student@alits.edu", "Student@2026"],
];

function loginErrorMessage(err) {
  const msg = err.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (!err.response || err.response.status >= 500) {
    return "Cannot reach the server. Wait a moment and try again — the API may still be starting.";
  }
  return "Login failed";
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@alits.edu");
  const [password, setPassword] = useState("ALITS@2026");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === "student" ? "/portal" : "/app"} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const signedIn = await login(email, password);
      navigate(signedIn.role === "student" ? "/portal" : "/app", { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScanEnter>
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="section-dark relative hidden overflow-hidden lg:block">
        <img
          src="/hero-hall.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Logo light />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">Issuer console</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">
              The same desk that signs a certificate also watches every scan.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70">
              Registrars, faculty issuers, and students each get a role-aware workspace.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#141414] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="ink text-3xl font-extrabold">
            <HashDecode text="Sign in" />
          </h2>
          <p className="muted mt-2">Use your institute email. Students can also create an account.</p>
          <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
            <div>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Signing in…" : "Continue"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-400">
            New student?{" "}
            <Link to="/register" className="font-semibold text-[#baff39]">
              Create a portal account
            </Link>
          </p>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Demo accounts</p>
            <div className="mt-3 space-y-2">
              {demos.map(([role, em, pw]) => (
                <button
                  key={em}
                  type="button"
                  className="flex w-full items-center justify-between border border-white/15 bg-[#1f1f1f] px-3 py-2 text-left text-xs hover:border-[#baff39]"
                  onClick={() => {
                    setEmail(em);
                    setPassword(pw);
                  }}
                >
                  <span className="font-semibold text-white">{role}</span>
                  <span className="text-neutral-400">{em}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </ScanEnter>
  );
}
