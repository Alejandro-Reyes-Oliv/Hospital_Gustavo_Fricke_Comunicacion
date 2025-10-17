export default function Button({ variant="primary", className="", ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm";
  const variants = {
    primary: "bg-[var(--brand)] text-white hover:opacity-95",
    ghost:   "bg-white text-[var(--ink)] border border-slate-200 hover:bg-slate-50",
    success: "bg-[var(--ok)] text-white hover:opacity-95",
    danger:  "bg-[var(--danger)] text-white hover:opacity-95",
  };
  const cls = [base, variants[variant] || variants.primary, className].join(' ');
  return <button className={cls} {...props} />;
}
