// src/app/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { qc } from "./queryClient.js";

import { RouterProvider } from "react-router-dom";
import { router } from "./router.jsx";

import api from "../shared/lib/apiClient.js";
import "./index.css";
import ApiStatusGate from "./ApiStatusGate.jsx";

// API base (única fuente)
api.baseURL = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

window.addEventListener("error",  (e) => console.error("[GlobalError]", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error("[PromiseRejection]", e.reason));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <ApiStatusGate>
        <RouterProvider router={router} />
      </ApiStatusGate>
    </QueryClientProvider>
  </StrictMode>
);
