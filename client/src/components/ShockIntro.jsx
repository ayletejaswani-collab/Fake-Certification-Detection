import { useEffect, useState } from "react";

const WORD = "ALITS";

export default function ShockIntro() {
  const [show, setShow] = useState(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return !sessionStorage.getItem("alits_intro");
  });

  function skip() {
    sessionStorage.setItem("alits_intro", "1");
    setShow(false);
  }

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(skip, 2600);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="shock-intro" onClick={skip} role="presentation">
      <div className="shock-intro-flash" />
      <div className="shock-intro-scan" />
      <p className="shock-intro-kicker">SEALED REGISTRY</p>
      <h2 className="shock-intro-word">
        {[...WORD].map((ch, i) => (
          <span key={ch + i} style={{ animationDelay: `${80 + i * 70}ms` }}>
            {ch}
          </span>
        ))}
      </h2>
      <p className="shock-intro-sub">VERIFY · OR · EXPOSE</p>
      <p className="shock-intro-skip">TAP TO SKIP</p>
    </div>
  );
}
