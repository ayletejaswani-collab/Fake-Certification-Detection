import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, FileBadge, ScanLine } from "lucide-react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";

const icons = {
  Issued: FileBadge,
  Verifications: ScanLine,
  Genuine: BadgeCheck,
  "Fake attempts": AlertTriangle,
};

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/analytics/overview").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-400">Loading dashboard…</p>;
  const t = data.totals;
  const cards = [
    ["Issued", t.certificates, "All templates"],
    ["Verifications", t.verifications, "Public + camera"],
    ["Genuine", t.genuine, "Passed every check"],
    ["Fake attempts", t.fakeAttempts, "Not found or tampered"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Good to see you</h1>
          <p className="muted mt-1">Live registry activity for ALITS Institute of Excellence.</p>
        </div>
        <Link to="/app/issue" className="btn-primary">
          Issue certificate
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, hint]) => {
          const Icon = icons[label];
          return (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-800">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold ink">{value ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">{hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4 text-sm">
          <p className="text-slate-500">Active</p>
          <p className="text-xl font-bold ink">{t.active}</p>
        </div>
        <div className="card p-4 text-sm">
          <p className="text-slate-500">Revoked</p>
          <p className="text-xl font-bold ink">{t.revoked}</p>
        </div>
        <div className="card p-4 text-sm">
          <p className="text-slate-500">Ledger</p>
          <p className="text-xl font-bold ink">
            {data.chain.integrity.valid ? "Intact" : "Broken"} · {data.chain.integrity.length} blocks
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold ink">Recent verifications</h2>
          </div>
          <ul>
            {data.recentLogs.map((log) => (
              <li key={log._id} className="flex items-center justify-between gap-3 border-b border-slate-50 px-5 py-3 text-sm last:border-0">
                <span className="font-mono text-xs text-slate-600">{log.certId || "—"}</span>
                <StatusBadge value={log.result} />
              </li>
            ))}
            {!data.recentLogs.length && <li className="px-5 py-6 text-sm text-slate-400">No scans yet.</li>}
          </ul>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold ink">Latest ledger blocks</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {data.chain.blocks.slice(0, 6).map((b) => (
              <li key={b._id} className="px-5 py-3">
                <p className="text-sm font-semibold ink">
                  Block #{b.index} · {b.certId}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-400">{b.blockHash}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
