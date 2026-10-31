import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FilePlus2,
  LayoutDashboard,
  Link2,
  LogOut,
  ScrollText,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import StatusBadge from "../components/StatusBadge";
import ScanEnter from "../components/ScanEnter";

const links = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/issue", label: "Issue certificate", icon: FilePlus2 },
  { to: "/app/certificates", label: "Registry", icon: ScrollText },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/chain", label: "Ledger", icon: Link2 },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#141414] text-white md:grid md:grid-cols-[260px_1fr]">
      <aside className="section-dark">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo light to="/app" />
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-bold uppercase tracking-wide ${
                  isActive ? "bg-[#baff39] text-black" : "text-neutral-400 hover:text-white"
                }`
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
          {user?.role === "superadmin" && (
            <NavLink
              to="/app/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-bold uppercase tracking-wide ${
                  isActive ? "bg-[#baff39] text-black" : "text-neutral-400 hover:text-white"
                }`
              }
            >
              <Users className="h-4 w-4" />
              People
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-5 py-3 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Issuer console</p>
            <p className="ink text-sm font-semibold">{user?.organization}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="ink text-sm font-semibold">{user?.name}</p>
              <StatusBadge value={user?.role} />
            </div>
            <div className="grid h-10 w-10 place-items-center text-sm font-black text-black" style={{ background: "#baff39" }}>
              {user?.name?.[0] || "A"}
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>
        <main className="p-5 md:p-8">
          <ScanEnter>
            <Outlet />
          </ScanEnter>
        </main>
      </div>
    </div>
  );
}
