import { useEffect } from "react";

export default function CursorGlow() {
  useEffect(() => {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    const move = (e) => {
      glow.style.transform = `translate(${e.clientX - 140}px, ${e.clientY - 140}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      glow.remove();
    };
  }, []);
  return null;
}
