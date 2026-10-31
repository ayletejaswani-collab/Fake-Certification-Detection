const themes = {
  academic: { wash: "#f7f1e4", ink: "#1b1530", gold: "#b8860b", accent: "#6b1d36" },
  workshop: { wash: "#eef4f8", ink: "#10233d", gold: "#c9a227", accent: "#1d4e6b" },
  internship: { wash: "#f3efe4", ink: "#14221a", gold: "#8a6d3b", accent: "#2f5d3a" },
};

export default function CertificateArt({
  name = "Arjun Sharma",
  course = "B.Tech Computer Science — Final Year Distinction",
  issueDate = "15 March 2026",
  issuer = "ALITS Institute of Excellence",
  certId = "ALITS-2026-REAL01",
  template = "academic",
  status = "active",
  compact = false,
}) {
  const t = themes[template] || themes.academic;
  const revoked = status === "revoked";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-lift ${compact ? "p-5" : "p-7 md:p-8"}`}
      style={{ background: t.wash, borderColor: t.gold }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-lg border-2" style={{ borderColor: t.ink }} />
      <div className="pointer-events-none absolute inset-3 rounded-md border" style={{ borderColor: t.gold }} />

      {revoked && (
        <div className="absolute right-6 top-6 rotate-12 rounded border-2 border-rose-600 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-rose-700">
          Revoked
        </div>
      )}

      <p className="relative text-center text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: t.gold }}>
        ALITS Institute of Excellence
      </p>
      <p className="relative mt-1 text-center font-serif text-[11px] italic" style={{ color: t.accent }}>
        Established for the advancement of verifiable merit
      </p>
      <h3
        className={`relative mt-4 text-center font-serif ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}
        style={{ color: t.accent }}
      >
        {template === "workshop"
          ? "Certificate of Workshop Completion"
          : template === "internship"
            ? "Certificate of Internship"
            : "Certificate of Academic Distinction"}
      </h3>
      <p className="relative mt-4 text-center text-[11px]" style={{ color: t.ink }}>
        This is to certify that
      </p>
      <p
        className={`relative mt-1 text-center font-serif italic ${compact ? "text-2xl" : "text-3xl md:text-4xl"}`}
        style={{ color: t.ink }}
      >
        {name}
      </p>
      <p className={`relative mx-auto mt-3 max-w-md text-center ${compact ? "text-xs" : "text-sm"}`} style={{ color: t.ink }}>
        has successfully completed <span className="font-semibold">{course}</span>
      </p>
      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 h-px w-28" style={{ background: t.ink }} />
          <p className="text-[10px] font-semibold" style={{ color: t.ink }}>
            {issuer}
          </p>
          <p className="text-[10px] opacity-70" style={{ color: t.ink }}>
            {issueDate}
          </p>
        </div>
        <div className="text-right">
          <div
            className="ml-auto grid h-14 w-14 place-items-center rounded-sm border bg-white text-[8px] font-bold leading-tight"
            style={{ borderColor: t.ink, color: t.ink }}
          >
            QR
            <br />
            VERIFY
          </div>
          <p className="mt-1 font-mono text-[9px]" style={{ color: t.ink }}>
            {certId}
          </p>
        </div>
      </div>
    </div>
  );
}
