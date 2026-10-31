import { useState } from "react";
import api from "../api/client";
import PublicLayout from "../components/PublicLayout";
import CertificateArt from "../components/CertificateArt";
import VerdictSlam from "../components/VerdictSlam";
import TiltFrame from "../components/TiltFrame";
import HashDecode from "../components/HashDecode";
import LedgerReveal from "../components/LedgerReveal";
import ScanEnter from "../components/ScanEnter";

const cards = [
  {
    title: "Genuine",
    tone: "border-emerald-200",
    id: "ALITS-2026-REAL01",
    name: "Arjun Sharma",
    course: "B.Tech Computer Science — Final Year Distinction",
    issueDate: "15 March 2026",
    template: "academic",
    status: "active",
    hint: "This ID exists. Hash and signature match the registry.",
  },
  {
    title: "Forged lookalike",
    tone: "border-rose-200",
    id: "FAKE-999-XXXX",
    name: "A. Sharma",
    course: "B.Tech Computer Science — Final Year Distinction",
    issueDate: "15 March 2026",
    template: "academic",
    status: "active",
    hint: "Printed to look real. The ID was never issued by ALITS.",
  },
  {
    title: "Revoked",
    tone: "border-amber-200",
    id: "ALITS-2026-REVOK1",
    name: "Demo Revoked Holder",
    course: "Cybersecurity Foundations",
    issueDate: "10 January 2026",
    template: "academic",
    status: "revoked",
    hint: "Once genuine. The issuer withdrew it without deleting the record.",
  },
];

export default function Demo() {
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState("");
  const [slam, setSlam] = useState(null);

  async function check(id) {
    setBusy(id);
    try {
      const { data } = await api.post("/api/verify", { certId: id, source: "demo" });
      setResults((prev) => ({ ...prev, [id]: data }));
      setSlam({ result: data.result, key: Date.now() });
    } finally {
      setBusy("");
    }
  }

  return (
    <PublicLayout>
      {slam && <VerdictSlam key={slam.key} result={slam.result} />}
      <ScanEnter>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#baff39]">
          <HashDecode text="Evaluation demo" />
        </p>
        <h1 className="page-title mt-2">
          <HashDecode text="Fake versus real" delay={80} />
        </h1>
        <p className="muted mt-3 max-w-2xl text-base">
          Three documents that can look similar on paper. Only the registry, hash, signature, and
          revocation list decide the official result. Run all three live.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {cards.map((card, i) => {
            const r = results[card.id];
            return (
              <LedgerReveal key={card.id} delay={i * 120}>
                <article className={`card overflow-hidden border-2 ${card.tone}`}>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                    <div className="mt-3">
                      <TiltFrame>
                        <CertificateArt
                          compact
                          name={card.name}
                          course={card.course}
                          issueDate={card.issueDate}
                          certId={card.id}
                          template={card.template}
                          status={card.status}
                        />
                      </TiltFrame>
                    </div>
                    <p className="muted mt-4">{card.hint}</p>
                    <button className="btn-primary mt-5 w-full" disabled={busy === card.id} onClick={() => check(card.id)}>
                      {busy === card.id ? "Contacting registry…" : "Run official check"}
                    </button>
                    {r && (
                      <p
                        className={`mt-4 text-center text-sm font-bold ${
                          r.result === "genuine"
                            ? "text-[#baff39]"
                            : r.result === "revoked"
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {r.verdict}
                      </p>
                    )}
                  </div>
                </article>
              </LedgerReveal>
            );
          })}
        </div>
      </div>
      </ScanEnter>
    </PublicLayout>
  );
}
