import { Link } from "react-router-dom";
import Title3D from "./Title3D";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center text-lg font-black"
        style={{ background: "#baff39", color: "#111", borderRadius: 2 }}
      >
        A
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-black uppercase tracking-[0.08em]">
          <Title3D text="ALITS" className="is-compact" />
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
          Institute
        </span>
      </span>
    </Link>
  );
}
