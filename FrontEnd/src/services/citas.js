const STORAGE_KEY = "appointments_local";


export async function listCitas() {
    const cache = localStorage.getItem(STORAGE_KEY);
    if(cache) return JSON.parse(cache)


    const r = await fetch("/citas.json");
    // array con los datos
    const data = await r.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data
}

function persist(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

}

export async function addAppointment({paciente, fecha, hora, estado= "pendiente"}){
    const rows = await listCitas();
    const id = rows.length ? Math.max(...rows.map(r =>Number(r.id)|| 0)) +1 :1;
    const nuevo = {id, paciente, fecha, hora, estado};
    const update = [nuevo, ...rows];
    persist(update);
    return nuevo
}

export async function updateStatus(ids = [], status = "pendiente") {
  const rows = await listCitas();
  const set = new Set(ids);
  const updated = rows.map(r => (set.has(r.id) ? { ...r, estado: status } : r));
  persist(updated);
  return updated.filter(r => set.has(r.id));
}

export async function sendBot(ids= []){
    //aqui deberia ir lo de con backend
    await new Promise(res => setTimeout(res,600));
    return{ sent:ids, ok: true};
}