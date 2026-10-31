import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, LogOut } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../components/PublicLayout";
import CertificateArt from "../components/CertificateArt";
import StatusBadge from "../components/StatusBadge";

export default function Portal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/api/certificates/mine").then((res) => setItems(res.data.certificates));
  }, []);

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
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Student portal</p>
            <h1 className="page-title mt-2">{user?.name}</h1>
            <p className="muted mt-1">Credentials issued to {user?.email}</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {items.map((c) => (
            <article key={c.certId} className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-xs font-semibold text-slate-500">{c.certId}</p>
                <StatusBadge value={c.status} />
              </div>
              <CertificateArt
                compact
                name={c.name}
                course={c.course}
                issueDate={c.issueDate}
                issuer={c.issuer}
                certId={c.certId}
                template={c.template}
                status={c.status}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => download(c.certId)}>
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                <Link className="btn-secondary" to={`/verify?id=${c.certId}`}>
                  Public verify page
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!items.length && (
          <div className="card mt-8 p-10 text-center">
            <p className="font-semibold ink">No certificates on this email yet</p>
            <p className="muted mt-2">Ask an issuer to generate one using this address.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
