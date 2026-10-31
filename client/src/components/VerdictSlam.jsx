import { useEffect, useState } from "react";

export default function VerdictSlam({ result, onDone }) {
  const [open, setOpen] = useState(Boolean(result));

  useEffect(() => {
    if (!result) return;
    setOpen(true);
    const ok = result === "genuine" || result === "offline_valid";
    const warn = result === "revoked";
    document.body.classList.add(ok ? "is-pulse" : warn ? "is-warn-flash" : "is-shaking");
    const t = setTimeout(() => {
      setOpen(false);
      document.body.classList.remove("is-shaking", "is-pulse", "is-warn-flash");
      onDone?.();
    }, 1700);
    return () => {
      clearTimeout(t);
      document.body.classList.remove("is-shaking", "is-pulse", "is-warn-flash");
    };
  }, [result, onDone]);

  if (!open || !result) return null;

  const ok = result === "genuine" || result === "offline_valid";
  const warn = result === "revoked";

  return (
    <div className={`verdict-slam ${ok ? "is-ok" : warn ? "is-warn" : "is-bad"}`}>
      <div className="verdict-slam-ring" />
      <div className="verdict-slam-bits" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <p className="verdict-slam-word">{ok ? "GENUINE" : warn ? "REVOKED" : "FAKE"}</p>
    </div>
  );
}
