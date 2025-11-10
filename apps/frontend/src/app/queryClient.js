import { QueryClient } from "@tanstack/react-query";

export const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const msg = String(error?.message || "");
        if (/401|403|404/i.test(msg)) return 0;     // no reintentar 4xx
        return failureCount < 2;                    // hasta 2 intentos
      },
      staleTime: 30_000,                            // 30s “fresco”
      gcTime: 5 * 60_000,                           // 5 min en cache
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
