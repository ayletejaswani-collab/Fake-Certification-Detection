import { useEffect, useState } from "react";

export default function CountUp({ to, suffix = "" }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1600;
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setN(Math.round(to * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return (
    <>
      {n.toLocaleString()}
      {suffix}
    </>
  );
}
