import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function Certificates() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("");

  async function load(query = q) {
    const { data } = await api.get("/api/certificates", { params: { q: query } });
    setItems(data.certificates);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revoke(certId) {
    if (!window.confirm(`Revoke ${certId}? The record stays in the registry.`)) return;
    await api.post(`/api/certificates/${certId}/revoke`, { reason: reason || "Revoked from dashboard" });
    setReason("");
    load();
  }

  async function download(certId) {
    const res = await api.get(`/api/certificates/${certId}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="page-title">Certificate registry</h1>
      <p className="muted mt-1">Search, download official PDFs, or revoke without deleting history.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="pl-9"
            placeholder="Search name, course, email, or ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <button className="btn-secondary" onClick={() => load()}>
          Search
        </button>
        <input
          className="max-w-xs"
          placeholder="Revoke reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Holder</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.certId} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-4">
                  <p className="font-mono text-xs font-semibold ink">{c.certId}</p>
                  <p className="mt-1 max-w-xs text-slate-500">{c.course}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium ink">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </td>
                <td className="px-4 py-4 capitalize text-slate-600">{c.template}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={c.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary px-3 py-1.5" onClick={() => download(c.certId)}>
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                    {c.status === "active" && (
                      <button className="rounded-xl px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={() => revoke(c.certId)}>
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
