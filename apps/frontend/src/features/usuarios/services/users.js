// src/features/usuarios/services/users.js
// Demo de Operarios SIN contraseñas/PII en localStorage.

const USERS_KEY = "operators_v2"; // ← nuevo namespace (no almacena password)

// --- util de storage seguro (solo campos permitidos)
const ALLOW = ["id", "username", "name", "role", "active", "createdAt"];
function safeUser(u) {
  const out = { id: u.id ?? null, username: String(u.username ?? ""), name: String(u.name ?? "") };
  out.role = u.role ?? "operario";
  out.active = u.active !== false;
  out.createdAt = u.createdAt ?? new Date().toISOString();
  return out;
}
function load() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(safeUser) : [];
  } catch { return []; }
}
function persist(arr) {
  const cleaned = arr.map(safeUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
}

// --- migración: borra datos antiguos con password (si existían)
(function migrateAwayFromPasswords() {
  try { localStorage.removeItem("operators_v1"); } catch {}
  // Si dejaste algún otro key viejo, límpialo aquí también.
})();

// --- API pública (sin password) ---------------------------------------------
export function ensureSeed() {
  const current = load();
  if (current.length > 0) return current;
  const seed = [
    { id: 1, username: "operario1", name: "Operario Uno", role: "operario", active: true, createdAt: new Date().toISOString() },
    { id: 2, username: "operario2", name: "Operario Dos", role: "operario", active: true, createdAt: new Date().toISOString() },
  ];
  persist(seed);
  return seed;
}

export function listUsers({ includeInactive = true } = {}) {
  const arr = load();
  return includeInactive ? arr : arr.filter(u => u.active !== false);
}

export function findByUsername(username) {
  const u = load().find(x => x.username?.toLowerCase() === String(username || "").toLowerCase());
  return u || null;
}

export function createUser({ username, name, role = "operario", active = true }) {
  const arr = load();
  const id = arr.length ? Math.max(...arr.map(u => Number(u.id) || 0)) + 1 : 1;
  const user = safeUser({ id, username, name, role, active, createdAt: new Date().toISOString() });
  arr.push(user);
  persist(arr);
  return user;
}

export function updateUser(id, patch = {}) {
  const arr = load();
  const idx = arr.findIndex(u => u.id === id);
  if (idx === -1) throw new Error("Usuario no encontrado");
  // Ignora cualquier intento de escribir 'password' u otros campos no permitidos
  const next = safeUser({ ...arr[idx], ...patch, id });
  arr[idx] = next;
  persist(arr);
  return next;
}

export function deleteUser(id) {
  const arr = load().filter(u => u.id !== id);
  persist(arr);
  return true;
}
