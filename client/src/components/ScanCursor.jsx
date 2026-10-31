import { useEffect } from "react";

export default function ScanCursor() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = document.createElement("div");
    el.className = "scan-cursor";
    el.innerHTML = "<i></i><i></i><i></i><i></i>";
    document.body.appendChild(el);
    document.body.classList.add("has-scan-cursor");

    const move = (e) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const hot = e.target.closest("a, button, .chaos-letter, summary, .tilt-frame");
      el.classList.toggle("is-hot", Boolean(hot));

      const btn = e.target.closest(".btn-lime, .btn-ghost, .btn-primary");
      document.querySelectorAll(".is-magnetic").forEach((node) => {
        if (node !== btn) node.style.transform = "";
        node.classList.remove("is-magnetic");
      });
      if (btn) {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.classList.add("is-magnetic");
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
      }
    };

    const leave = () => {
      document.querySelectorAll(".is-magnetic").forEach((node) => {
        node.style.transform = "";
        node.classList.remove("is-magnetic");
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      document.body.classList.remove("has-scan-cursor");
      document.querySelectorAll(".is-magnetic").forEach((node) => {
        node.style.transform = "";
        node.classList.remove("is-magnetic");
      });
      el.remove();
    };
  }, []);

  return null;
}
