// src/app/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./App.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import AppointmentsPage from "../features/citas/pages/AppointmentsPage.jsx";
import MedicosPage from "../features/medicos/pages/MedicosPage.jsx";
import UsersPage from "../features/usuarios/pages/UsersPage.jsx";
import NotFound from "./NotFound.jsx";
import { RequireAuth, RequireAdmin } from "./guards.jsx";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/citas" replace /> },
      {
        path: "/citas",
        element: (
          <RequireAuth>
            <AppointmentsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/medicos",
        element: (
          <RequireAdmin>
            <MedicosPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/usuarios",
        element: (
          <RequireAdmin>
            <UsersPage />
          </RequireAdmin>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
]);
