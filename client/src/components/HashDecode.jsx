import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#";

export default function HashDecode({ text, className = "", delay = 0 }) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }

    let frame;
    let start;
    const duration = 620 + text.length * 22;

    const tick = (now) => {
      if (start == null) start = now;
      const t = (now - start - delay) / duration;
      if (t < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, t);
      const locked = Math.floor(p * text.length);
      setOut(
        [...text]
          .map((ch, i) => {
            if (ch === " " || i < locked) return ch;
            return GLYPHS[(Math.random() * GLYPHS.length) | 0];
          })
          .join("")
      );
      if (p < 1) frame = requestAnimationFrame(tick);
      else setOut(text);
    };

    setOut([...text].map((ch) => (ch === " " ? " " : "0")).join(""));
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, delay]);

  return <span className={`hash-decode ${className}`}>{out}</span>;
}
