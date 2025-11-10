// src/features/auth/services/auth.js
import { listUsers as _listUsers } from "../../usuarios/services/users.js";

const AUTH_STORAGE_KEY = "auth_demo_v3"; // <- los guards leen esta

const defaultUser = {
  username: "admin",
  name: "Administrador",
  role: "admin",
  demo: true,
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

  // Admin demo
  if ((u === "admin" || u.toLowerCase() === "administrador") && p === "admin123") {
    const session = { user: { ...defaultUser, username: "admin" }, ts: Date.now() };
    saveSession(session);
    return session.user;
  }

  // Operarios/usuarios de la lista local (demo)
  const arr = typeof _listUsers === "function" ? _listUsers() : [];
  const found = arr.find(x => String(x.username || "").toLowerCase() === u.toLowerCase());

  if (found && (found.active ?? true) && String(found.password || "") === p) {
    const session = {
      user: {
        username: found.username,
        name: found.name || found.username,
        role: found.role || "operario",
        demo: true,
      },
      ts: Date.now(),
    };
    saveSession(session);
    return session.user;
  }

  throw new Error("Credenciales inválidas");
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAdmin(user) {
  return !!user && (user.role === "admin" || String(user.username || "").toLowerCase() === "admin");
}
