import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import CertificateArt from "../components/CertificateArt";

const templates = [
  { id: "academic", label: "Academic distinction" },
  { id: "workshop", label: "Workshop completion" },
  { id: "internship", label: "Internship" },
];

export default function Issue() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    course: "",
    issueDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    issuer: "ALITS Institute of Excellence",
    template: "academic",
    sealShape: "round",
    grade: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/certificates", form);
      setCreated(data);
      if (!data.studentPassword) navigate("/app/certificates");
    } catch (err) {
      setError(err.response?.data?.message || "Could not issue certificate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Issue a certificate</h1>
      <p className="muted mt-1">Preview updates as you type. Sealing writes the hash, QR, PDF, and ledger block.</p>
      <div className="mt-8 grid items-start gap-8 xl:grid-cols-2">
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label>Student name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label>Student email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <label>Course / achievement</label>
            <input value={form.course} onChange={(e) => set("course", e.target.value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label>Issue date</label>
              <input value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} required />
            </div>
            <div>
              <label>Grade (optional)</label>
              <input value={form.grade} onChange={(e) => set("grade", e.target.value)} />
            </div>
          </div>
          <div>
            <label>Issuing authority</label>
            <input value={form.issuer} onChange={(e) => set("issuer", e.target.value)} />
          </div>
          <div>
            <label>Template</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set("template", t.id)}
                  className={`border px-3 py-3 text-left text-sm font-extrabold ${
                    form.template === t.id
                      ? "border-[#baff39] bg-[#baff39] text-black"
                      : "border-white/20 bg-[#2a2a2a] text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Official seal</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { id: "round", label: "Round seal" },
                { id: "square", label: "Square seal" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set("sealShape", t.id)}
                  className={`border px-3 py-3 text-left text-sm font-extrabold ${
                    form.sealShape === t.id
                      ? "border-[#baff39] bg-[#baff39] text-black"
                      : "border-white/20 bg-[#2a2a2a] text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="muted mt-2 text-xs">
              The seal shape is part of the signed record. Uploads showing a different shape are marked fake.
            </p>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {created && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Issued <strong>{created.certificate.certId}</strong>
              {created.studentPassword ? ` · new student password: ${created.studentPassword}` : ""}
            </div>
          )}
          <button className="btn-primary" disabled={busy}>
            {busy ? "Sealing certificate…" : "Generate official PDF"}
          </button>
        </form>
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-500">Live preview</p>
          <CertificateArt
            name={form.name || "Student name"}
            course={form.course || "Programme or workshop title"}
            issueDate={form.issueDate}
            issuer={form.issuer}
            certId="ALITS-XXXX-PREVIEW"
            template={form.template}
          />
        </div>
      </div>
    </div>
  );
}
