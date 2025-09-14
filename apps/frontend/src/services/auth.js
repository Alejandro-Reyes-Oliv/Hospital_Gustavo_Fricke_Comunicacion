import { listUsers as _listUsers } from "./users.js";

const AUTH_STORAGE_KEY = "auth_session_v1";

// Usuario admin "hardcodeado" para demo
const defaultUser = {
  username: "admin",
  name: "Administrador",
  role: "admin",
};

function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const s = loadSession();
  return s?.user || null;
}

export function login(username, password) {
  const u = String(username || "").trim();
  const p = String(password || "");

  // Admin de demo
  if ((u === "admin" || u.toLowerCase() === "administrador") && p === "admin123") {
    const session = { user: { ...defaultUser, username: "admin" }, ts: Date.now() };
    saveSession(session);
    return session.user;
  }

  // Operarios desde almacenamiento local
  const arr = _listUsers ? _listUsers() : [];
  const found = arr.find(x => x.username?.toLowerCase() === u.toLowerCase());
  if (found && found.active && String(found.password || "") === p) {
    const session = { user: { username: found.username, name: found.name || found.username, role: found.role || "operario" }, ts: Date.now() };
    saveSession(session);
    return session.user;
  }

  throw new Error("Credenciales inválidas");
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAdmin(user) {
  return !!user && (user.role === "admin" || user.username?.toLowerCase() === "admin");
}
