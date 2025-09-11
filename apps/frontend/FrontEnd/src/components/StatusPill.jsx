export default function StatusPill({ estado }) {
  const s = String(estado || "").toLowerCase();
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  if (s.includes("confirm")) return <span className={`${base} bg-green-100 text-green-700`}>{estado}</span>;
  if (s.includes("cancel"))  return <span className={`${base} bg-red-100 text-red-700`}>{estado}</span>;
  if (s.includes("pend"))    return <span className={`${base} bg-yellow-100 text-yellow-700`}>{estado}</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{estado}</span>;
}
