import api from '../lib/api';

export async function getDoctores(){
  const { data } = await api.get('/v1/doctores'); // ajusta el path
  const rows = Array.isArray(data) ? data : (data.items || data.results || []);
  return rows.map(d => ({
    id: d.id ?? d._id ?? d.uuid,
    nombre: d.nombre || d.name,
    especialidad: d.especialidad || d.specialty || '',
  }));
}
