const USERS_KEY = "operators_v1";

function load() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(arr) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}

function normalizePasswords(arr) {
  let changed = false;
  const out = arr.map(u => {
    if (u.password == null) {
      changed = true;
      return { ...u, password: "clave123" };
    }
    return u;
  });
  return { arr: out, changed };
}

// Seed inicial (solo si no hay nada) + normalización si ya existían
export function ensureSeed() {
  const current = load();
  const norm = normalizePasswords(current);
  if (norm.changed) {
    persist(norm.arr);
    return norm.arr;
  }
  if (current.length === 0) {
    const seed = [
      { id: 1, username: "operario1", name: "Operario Uno", role: "operario", active: true, password: "clave123", createdAt: new Date().toISOString() },
      { id: 2, username: "operario2", name: "Operario Dos", role: "operario", active: true, password: "clave123", createdAt: new Date().toISOString() },
    ];
    persist(seed);
    return seed;
  }
  return current;
}

export function listUsers() {
  return load();
}

export function findByUsername(username) {
  const arr = load();
  const u = arr.find(x => x.username?.toLowerCase() === String(username || "").toLowerCase());
  return u || null;
}

export function createUser({ username, name, role = "operario", active = true, password = "" }) {
  const arr = load();
  const id = arr.length ? Math.max(...arr.map(u => u.id)) + 1 : 1;
  const user = { id, username, name, role, active, password, createdAt: new Date().toISOString() };
  arr.push(user);
  persist(arr);
  return user;
}

export function updateUser(id, patch) {
  const arr = load();
  const idx = arr.findIndex(u => u.id === id);
  if (idx === -1) throw new Error("Usuario no encontrado");
  arr[idx] = { ...arr[idx], ...patch };
  persist(arr);
  return arr[idx];
}

export function deleteUser(id) {
  const arr = load();
  const filtered = arr.filter(u => u.id !== id);
  persist(filtered);
  return true;
}
