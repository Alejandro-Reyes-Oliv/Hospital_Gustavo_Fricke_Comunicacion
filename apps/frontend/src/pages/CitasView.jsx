import { useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function CitasView({
  rows = [], selected = new Set(), onToggle, onConfirm, onCancel,
  searchValue, onSearch,
}){
  const [localSel, setLocalSel] = useState(new Set());
  const [q, setQ] = useState("");
  const effectiveSel = onToggle ? selected : localSel;
  const toggle = (id)=>{
    if(onToggle) return onToggle(id);
    setLocalSel(s=>{ const n=new Set(s); n.has(id)? n.delete(id):n.add(id); return n; });
  };
  const term = searchValue ?? q;
  const setTerm = onSearch ?? setQ;
  const data = useMemo(()=>{
    if(!term) return rows;
    const t = term.toLowerCase();
    return rows.filter(r =>
      r.paciente?.toLowerCase().includes(t) ||
      r.rut?.toLowerCase().includes(t) ||
      r.doctor?.toLowerCase().includes(t) ||
      r.estado?.toLowerCase().includes(t)
    );
  }, [rows, term]);

  return (
    <Card title="Panel de citas" action={<div className="flex gap-3"><Button>+ Nueva Cita</Button><Button variant="ghost">🟢 Contactar</Button></div>}>
      <div className="flex items-center gap-3 mb-3">
        <input className="border rounded-xl px-3 py-2 w-80" placeholder="Buscar cita" value={term} onChange={e=>setTerm(e.target.value)} />
      </div>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50"><tr className="[&>th]:p-3 text-left">
            <th></th><th>Rut</th><th>Paciente</th><th>Fecha</th><th>Hora</th>
            <th>Especialista</th><th>Especialidad</th><th>Teléfono</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {data.map(r=> (
              <tr key={r.id} className="border-t [&>td]:p-3">
                <td><input type="checkbox" checked={effectiveSel.has(r.id)} onChange={()=>toggle(r.id)} /></td>
                <td>{r.rut}</td><td>{r.paciente}</td><td>{r.fecha}</td><td>{r.hora}</td>
                <td>{r.doctor}</td><td>{r.especialidad}</td><td>{r.telefono}</td><td>{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-6">
        <span className="text-slate-500 text-sm">Eliminar selección</span>
        <div className="ml-auto flex gap-3">
          <Button variant="success" onClick={onConfirm}>✓ Confirmar</Button>
          <Button variant="danger" onClick={onCancel}>🗑 Cancelar</Button>
        </div>
      </div>
    </Card>
  );
}
