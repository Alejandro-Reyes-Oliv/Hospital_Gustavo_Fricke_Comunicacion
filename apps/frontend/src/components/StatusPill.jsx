export default function StatusPill({ estado }) {
  const s = String(estado || "").toLowerCase();
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  if (s.includes("confirmada")) return <span className={`${base} bg-[#2DCD39] text-white`}>{estado}</span>;
  if (s.includes("cancelada"))  return <span className={`${base} bg-[#FD0327] text-white`}>{estado}</span>;
  if (s.includes("pendiente"))    return <span className={`${base} bg-[#F0F1FF] text-[#0C4581]`}>{estado}</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{estado}</span>;
}
