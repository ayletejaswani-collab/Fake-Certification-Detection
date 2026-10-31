import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const LABELS = {
  "/": "ALITS",
  "/verify": "VERIFY",
  "/demo": "EXPOSE",
  "/login": "CONSOLE",
  "/register": "PORTAL",
  "/app": "REGISTRY",
  "/portal": "WALLET",
};

const COLS = 14;
const ROWS = 9;
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => i);

function labelFor(path) {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith("/app")) return "REGISTRY";
  if (path.startsWith("/verify")) return "VERIFY";
  return "CERTICHAIN";
}

function hexNoise() {
  return Array.from({ length: 24 }, () => "0123456789ABCDEF"[(Math.random() * 16) | 0]).join("");
}

export default function RouteScan() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [show, setShow] = useState(false);
  const [word, setWord] = useState("ALITS");
  const [hash, setHash] = useState(hexNoise());

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setWord(labelFor(pathname));
    setHash(hexNoise());
    setShow(true);
    const scramble = setInterval(() => setHash(hexNoise()), 40);
    const done = setTimeout(() => {
      clearInterval(scramble);
      setShow(false);
    }, 720);
    return () => {
      clearInterval(scramble);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="route-scan" aria-hidden>
      <div className="route-scan-grid">
        {CELLS.map((i) => (
          <i
            key={i}
            style={{
              "--c": i % COLS,
              "--r": Math.floor(i / COLS),
            }}
          />
        ))}
      </div>
      <div className="route-scan-beam" />
      <div className="route-scan-copy">
        <p className="route-scan-kicker">READING PAYLOAD</p>
        <p className="route-scan-word">{word}</p>
        <p className="route-scan-hash">{hash}</p>
      </div>
    </div>
  );
}
