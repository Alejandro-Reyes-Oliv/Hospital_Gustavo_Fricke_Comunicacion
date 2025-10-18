import api from '../lib/api';
import { mapAppointment } from './appointmentsAdapter';

const ENDPOINTS = {
  list: '/v1/citas',            // ajusta si tu backend usa otro path
  confirm: '/v1/citas/confirmar',
  cancel: '/v1/citas/cancelar',
};

export async function getCitas(params={}){
  try{
    const { data } = await api.get(ENDPOINTS.list, { params });
    const rows = Array.isArray(data) ? data : (data.items || data.results || []);
    return rows.map(mapAppointment);
  }catch(err){
    // fallback para que la UI cargue igual si la API no está
    const local = await fetch('/citas.json').then(r=>r.json()).catch(()=>[]);
    return local.map(mapAppointment);
  }
}

export async function confirmarCitas(ids){
  return api.post(ENDPOINTS.confirm, { ids });
}

export async function cancelarCitas(ids){
  return api.post(ENDPOINTS.cancel, { ids });
}
