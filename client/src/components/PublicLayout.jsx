import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/#how-it-works", label: "HOW IT WORKS" },
  { to: "/verify", label: "VERIFY" },
  { to: "/demo", label: "LIVE DEMO" },
];

export default function PublicLayout({ children, overlayNav = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const home = user?.role === "student" ? "/portal" : user ? "/app" : "/login";

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header
        className={`z-40 ${overlayNav ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-white/10 bg-[#141414]/95 backdrop-blur"}`}
      >
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-8 text-[12px] font-bold tracking-[0.16em] text-white md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-barcode hover:text-[#baff39]">
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/verify" className="btn-ghost">
              Verify
            </Link>
            <Link to={home} className="btn-lime">
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>
          <button className="text-white md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-white/10 bg-[#141414] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-bold tracking-widest">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <Link to={home} className="btn-lime" onClick={() => setOpen(false)}>
                {user ? "Dashboard" : "Sign in"}
              </Link>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="bg-[#111] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              Official digital credentials of ALITS Institute. Every certificate is sealed, QR-coded,
              and independently verifiable.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#baff39]">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-300">
              <Link to="/verify">Public verification</Link>
              <Link to="/demo">Fake vs real demo</Link>
              <Link to="/login">Issuer console</Link>
              <Link to="/register">Student portal</Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#baff39]">Registry</p>
            <p className="mt-3 text-sm text-neutral-400">
              Registrar’s Office
              <br />
              ALITS Institute of Excellence
              <br />
              credentials@alits.edu
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} ALITS Institute.
        </div>
      </footer>
    </div>
  );
}
