import Card from "../components/Card";
import PieChartCard from "./PieChartCard";
import Button from "../components/Button";

export default function DashboardView({ citas = [], seleccion = null, onEdit, onDelete }){
  const proximo = citas.slice(0,3);
  const counts = citas.reduce((acc,c)=>{acc[c.estado]=1+(acc[c.estado]||0);return acc;}, {});
  const pie = [
    { name:"Confirmadas", value: counts.Confirmada || 0 },
    { name:"Pendientes", value: counts.Pendiente || 0 },
    { name:"Cancelada",  value: counts.Cancelada  || 0 },
  ];
  const actual = seleccion || citas[0];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <PieChartCard data={pie}/>
      <Card title="Próximas citas">
        <ul className="divide-y">
          {proximo.map((c)=> (
            <li key={c.id} className="py-3 flex justify-between">
              <span>{c.paciente} <span className="text-slate-500">— {c.doctor}</span></span>
              <span className="font-medium">{c.hora}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Detalle de cita" className="xl:col-span-2">
        {actual ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Datos del paciente</h4>
              <p><b>Nombre:</b> {actual.paciente}</p>
              <p><b>Edad:</b> {actual.edad ?? "-" } años</p>
              <p><b>Contacto:</b> {actual.telefono}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Datos de cita</h4>
              <p><b>Fecha:</b> {actual.fecha}</p>
              <p><b>Hora:</b> {actual.hora}</p>
              <p><b>Doctor:</b> {actual.doctor}</p>
              <div className="mt-4 flex gap-3">
                <Button onClick={onEdit}>✎ Editar</Button>
                <Button variant="danger" onClick={onDelete}>🗑 Eliminar</Button>
              </div>
            </div>
          </div>
        ) : <p className="text-slate-500">Selecciona una cita…</p>}
      </Card>
    </div>
  );
}
