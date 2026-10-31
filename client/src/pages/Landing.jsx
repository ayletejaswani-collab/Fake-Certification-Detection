import { Link } from "react-router-dom";
import { Camera, Play, ShieldCheck, QrCode, LockKeyhole, FileBadge, ScanLine, Building2 } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import Title3D from "../components/Title3D";
import CertificateArt from "../components/CertificateArt";
import ShockIntro from "../components/ShockIntro";
import TiltFrame from "../components/TiltFrame";
import CountUp from "../components/CountUp";
import HashDecode from "../components/HashDecode";
import LedgerReveal from "../components/LedgerReveal";

const partners = ["INFOSYS", "TCS", "WIPRO", "DELOITTE", "AMAZON", "IIT MADRAS"];

const features = [
  { icon: FileBadge, title: "Official PDFs", text: "Academic, workshop, and internship templates with seals and a unique ID." },
  { icon: QrCode, title: "QR on every copy", text: "Any phone camera opens a live genuine or fake verdict." },
  { icon: LockKeyhole, title: "Tamper-proof seal", text: "HMAC-SHA256 plus an RSA signature. One altered letter fails the check." },
  { icon: ShieldCheck, title: "Revoke, don’t delete", text: "Withdrawn certificates stay in history as Invalid — Revoked." },
  { icon: ScanLine, title: "Public desk", text: "No login. Type an ID, scan, or run the offline QR payload." },
  { icon: Building2, title: "Two portals", text: "Issuers manage the registry. Students download and share." },
];

const steps = [
  { n: "01", title: "Issuer writes the record", text: "Name, course, date, template. ALITS assigns a unique ID." },
  { n: "02", title: "Seal, QR, PDF", text: "Hash, signature, ledger block, and a downloadable certificate." },
  { n: "03", title: "Anyone verifies", text: "Registry recomputes the hash. Match is genuine. Miss is fake." },
];

const faqs = [
  { q: "Can someone print a lookalike?", a: "Yes — that is the demo. A forged printout has no registry record, so the result is Invalid / Fake." },
  { q: "What if a real certificate is withdrawn?", a: "Issuers revoke it. The record stays. Future scans show Invalid — Revoked." },
  { q: "Does it work offline?", a: "The QR carries a signed payload. Offline checks the signature. Online also checks revocation." },
];

export default function Landing() {
  return (
    <PublicLayout overlayNav>
      <ShockIntro />
      <div className="scan-enter">
      <section className="relative min-h-[100svh] overflow-hidden">
        <img src="/hero-hall.png" alt="" className="hero-kenburns absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-20 pt-28 md:justify-center md:pb-24">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.32em] text-[#baff39]">
            <HashDecode text="Official credential space" />
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[1.35] tracking-tight md:text-7xl lg:text-[5.2rem]">
            <Title3D text="The proof" />
            <br />
            <Title3D text="paper has" />
            <br />
            <Title3D text="been missing" />
          </h1>
          <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-neutral-200">
            Upload a certificate from your device. ALITS checks the signed QR and the round or square
            seal, then confirms real, revoked, or fake.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/verify" className="btn-lime">
              <Camera className="h-4 w-4" /> Verify now
            </Link>
            <Link to="/demo" className="btn-ghost">
              <Play className="h-4 w-4" /> Fake vs real
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1a1a1a]">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-neutral-500">Trusted on drives</p>
          <div className="marquee">
            <div className="marquee-track text-[12px] font-extrabold tracking-[0.14em] text-neutral-400">
              {[...partners, ...partners].map((p, i) => (
                <span key={`${p}-${i}`}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#111] px-5 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          <LedgerReveal className="stat-pop">
            <p className="text-4xl font-black text-[#baff39]">
              <CountUp to={4821} />
            </p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">Sealed credentials</p>
          </LedgerReveal>
          <LedgerReveal className="stat-pop" delay={90}>
            <p className="text-4xl font-black text-white">
              <CountUp to={4} />
            </p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">Live verdicts</p>
          </LedgerReveal>
          <LedgerReveal className="stat-pop" delay={180}>
            <p className="text-4xl font-black text-white">256</p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">Bit HMAC seal</p>
          </LedgerReveal>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#141414] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#baff39]">How it works</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[1.15] md:text-5xl">
            <Title3D text="From issue to a" />
            <br />
            <Title3D text="recruiter phone" />
          </h2>
          <div className="step-rail mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <LedgerReveal key={s.n} delay={i * 110}>
                <div className="card p-7">
                  <p className="text-3xl font-black text-[#baff39]">{s.n}</p>
                  <h3 className="mt-3 text-lg font-extrabold uppercase text-white">{s.title}</h3>
                  <p className="muted mt-2">{s.text}</p>
                </div>
              </LedgerReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <img src="/cert-still.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[#111]/80" />
        <div className="relative mx-auto max-w-6xl px-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#baff39]">Platform</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[1.15] md:text-5xl">
            <Title3D text="Built like a real registrar" />
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <LedgerReveal key={f.title} delay={i * 80}>
                <div className="feature-card p-6">
                  <f.icon className="h-6 w-6 text-[#baff39]" />
                  <h3 className="mt-4 text-lg font-extrabold uppercase text-white">{f.title}</h3>
                  <p className="muted mt-2">{f.text}</p>
                </div>
              </LedgerReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
        <TiltFrame>
          <CertificateArt />
        </TiltFrame>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#baff39]">Live specimen</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-[1.15]">
            <Title3D text="Check ALITS-2026-REAL01" />
          </h2>
          <p className="muted mt-4 text-base">
            A real issued record. Open verification and watch the registry return Valid — Genuine.
          </p>
          <Link to="/verify?id=ALITS-2026-REAL01" className="btn-lime mt-6">
            Run this ID
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1a1a1a] py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-4xl font-black uppercase leading-[1.15]">
            <Title3D text="Questions we get" />
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item, i) => (
              <LedgerReveal key={item.q} delay={i * 70}>
                <details className="card p-5">
                  <summary className="cursor-pointer list-none text-base font-extrabold uppercase text-white">
                    {item.q}
                  </summary>
                  <p className="muted mt-3">{item.a}</p>
                </details>
              </LedgerReveal>
            ))}
          </div>
        </div>
      </section>
      </div>
    </PublicLayout>
  );
}
