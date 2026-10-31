import { useRef } from "react";

function chaos(seed) {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

function replay(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export default function Title3D({ text, className = "" }) {
  const wrap = useRef(null);
  const compact = className.includes("is-compact");

  function magnet(event) {
    const root = wrap.current;
    if (!root || compact) return;
    const letters = [...root.querySelectorAll(".chaos-letter")];
    letters.forEach((node) => {
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.max(0, 1 - dist / 180);
      node.style.setProperty("--mx", `${(dx / dist) * pull * 18}px`);
      node.style.setProperty("--my", `${(dy / dist) * pull * 18}px`);
    });
  }

  function resetMagnet() {
    wrap.current?.querySelectorAll(".chaos-letter").forEach((node) => {
      node.style.setProperty("--mx", "0px");
      node.style.setProperty("--my", "0px");
    });
  }

  function wake(event) {
    const el = event.currentTarget;
    replay(el, "is-live");
    replay(el, "is-glitch");
    const letters = [...el.parentElement.querySelectorAll(".chaos-letter")];
    const idx = letters.indexOf(el);
    letters.forEach((node, i) => {
      if (i === idx) return;
      if (Math.abs(i - idx) <= 2) replay(node, "is-near");
    });
  }

  function clear(event) {
    const name = event.animationName;
    if (name === "letter-live") event.currentTarget.classList.remove("is-live");
    if (name === "letter-near") event.currentTarget.classList.remove("is-near");
    if (name === "letter-glitch") event.currentTarget.classList.remove("is-glitch");
  }

  return (
    <span
      ref={wrap}
      className={`title-3d title-chaos ${className}`}
      onPointerMove={magnet}
      onPointerLeave={resetMagnet}
    >
      {[...text].map((ch, i) => {
        if (ch === " ") {
          return (
            <span key={`sp-${i}`} className="letter-3d-space">
              {"\u00A0"}
            </span>
          );
        }

        const a = chaos(i + ch.charCodeAt(0));
        const b = chaos(i * 3.1 + 7);
        const c = chaos(i * 5.7 + 13);
        const rotate = compact ? (a - 0.5) * 8 : (a - 0.5) * 38;
        const lift = compact ? 0 : (b - 0.5) * 28;
        const scale = compact ? 1 : 0.72 + c * 0.7;
        const tone = Math.floor(chaos(i * 9.2) * 4);

        return (
          <span
            key={`${ch}-${i}`}
            className={`letter-3d chaos-letter tone-${tone}`}
            data-letter={ch}
            onPointerEnter={wake}
            onPointerDown={wake}
            onAnimationEnd={clear}
            style={{
              animationDelay: `${i * 42}ms`,
              "--rx": `${rotate}deg`,
              "--lift": `${lift}px`,
              "--sc": scale,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
