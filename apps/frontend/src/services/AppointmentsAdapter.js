// Mapea el objeto del backend al shape de la UI
export function mapAppointment(x){
  if(!x) return null;
  const nombre = x.paciente?.nombre || x.nombre || `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim();
  const estadoRaw = (x.estado || x.status || '').toLowerCase();
  const estado = estadoRaw.includes('confirm') ? 'Confirmada'
               : estadoRaw.includes('cancel')  ? 'Cancelada'
               : 'Pendiente';
  const fecha = x.fecha || x.date || x.fecha_cita || '';
  const hora = x.hora || x.time || x.hora_cita || '';
  const doctor = x.doctor?.nombre || x.doctor || x.medico || '';
  return {
    id: x.id ?? x._id ?? x.uuid,
    rut: x.rut || x.identificador || x.run || '',
    paciente: nombre || '—',
    fecha,
    hora,
    doctor,
    especialidad: x.especialidad || x.specialty || '',
    telefono: x.telefono || x.phone || '',
    estado,
    edad: x.edad || x.age,
  };
}
