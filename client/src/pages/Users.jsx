import { useEffect, useState } from "react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";

const fields = [
  ["name", "Full name"],
  ["email", "Email"],
  ["password", "Temporary password"],
  ["organization", "Organization"],
  ["phone", "Phone"],
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", organization: "", phone: "" });
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/api/auth/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function createIssuer(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/auth/issuers", form);
      setForm({ name: "", email: "", password: "", organization: "", phone: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create issuer");
    }
  }

  return (
    <div>
      <h1 className="page-title">People</h1>
      <p className="muted mt-1">Registrars can add faculty issuers. Students self-register or are created at issue time.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 font-bold ink">Directory</div>
          <ul>
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 border-b border-slate-50 px-5 py-4 last:border-0">
                <div>
                  <p className="font-semibold ink">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <StatusBadge value={u.role} />
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={createIssuer} className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-bold ink">Add an issuer</h2>
          {fields.map(([key, label]) => (
            <div key={key}>
              <label>{label}</label>
              <input
                type={key === "password" ? "password" : "text"}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={["name", "email", "password"].includes(key)}
              />
            </div>
          ))}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary">Create issuer</button>
        </form>
      </div>
    </div>
  );
}
