// src/app/guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, isAdmin } from "../features/auth/services/auth.js";

export function RequireAuth({ children }) {
  const u = getCurrentUser();
  const loc = useLocation();
  if (!u) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

export function RequireAdmin({ children }) {
  const u = getCurrentUser();
  const loc = useLocation();
  if (!u) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!isAdmin(u)) return <Navigate to="/citas" replace state={{ from: loc }} />;
  return children;
}
