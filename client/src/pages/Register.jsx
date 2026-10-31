import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import HashDecode from "../components/HashDecode";
import ScanEnter from "../components/ScanEnter";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/portal");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScanEnter>
    <div className="min-h-screen bg-[#141414] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Logo />
        <h1 className="mt-8 text-3xl font-extrabold ink">
          <HashDecode text="Create your student portal" />
        </h1>
        <p className="muted mt-2">Certificates issued to this email will appear here automatically.</p>
        <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label>Full name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
          </div>
          <div>
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold ink">
            Sign in
          </Link>
        </p>
      </div>
    </div>
    </ScanEnter>
  );
}
