// Servicios de Médicos
export async function listMedicos() {
  // Backend real: return fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctors`).then(r=>r.json());
  const r = await fetch('/mock/medicos.json');
  return r.json();
}
