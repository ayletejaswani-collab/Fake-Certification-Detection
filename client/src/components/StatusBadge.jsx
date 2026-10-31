const styles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  genuine: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  offline_valid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  revoked: "bg-amber-50 text-amber-800 ring-amber-200",
  fake: "bg-rose-50 text-rose-700 ring-rose-200",
  tampered: "bg-rose-50 text-rose-700 ring-rose-200",
  not_found: "bg-rose-50 text-rose-700 ring-rose-200",
  offline_invalid: "bg-rose-50 text-rose-700 ring-rose-200",
  superadmin: "bg-slate-900 text-white ring-slate-900",
  issuer: "bg-sky-50 text-sky-800 ring-sky-200",
  student: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function StatusBadge({ value }) {
  const key = String(value || "").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${styles[key] || styles.student}`}>
      {String(value || "").replaceAll("_", " ")}
    </span>
  );
}
