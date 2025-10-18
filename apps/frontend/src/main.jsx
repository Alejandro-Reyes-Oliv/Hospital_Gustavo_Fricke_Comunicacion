// apps/frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from './lib/apiClient.js';
import './index.css';

api.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
console.log('[api.baseURL]', api.baseURL);  

const qc = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
