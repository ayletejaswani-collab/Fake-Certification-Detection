import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/client";

const tooltip = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 };

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/analytics/overview").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-400">Loading analytics…</p>;

  return (
    <div>
      <h1 className="page-title">Analytics</h1>
      <p className="muted mt-1">Verification volume, forgeries caught, and how templates are used.</p>
      <div className="card mt-8 h-80 p-5">
        <p className="text-sm font-semibold ink">Checks over time</p>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={data.series}>
            <CartesianGrid stroke="#eef2f6" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={tooltip} />
            <Area type="monotone" dataKey="genuine" stroke="#0d8a7b" fill="rgba(13,138,123,0.16)" />
            <Area type="monotone" dataKey="fake" stroke="#e11d48" fill="rgba(225,29,72,0.12)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card h-72 p-5">
          <p className="text-sm font-semibold ink">Templates issued</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.templates}>
              <CartesianGrid stroke="#eef2f6" />
              <XAxis dataKey="template" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="count" fill="#123056" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold ink">Notification log</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {data.notifications.map((n) => (
              <li key={n._id} className="rounded-xl bg-slate-50 px-3 py-2">
                <span className="font-semibold capitalize">{n.status}</span> · {n.type} → {n.to}
                <p className="text-xs text-slate-400">{n.subject || n.body.slice(0, 90)}</p>
              </li>
            ))}
            {!data.notifications.length && (
              <li className="text-slate-400">No alerts yet. SMTP/Twilio stay optional — events still log here.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
