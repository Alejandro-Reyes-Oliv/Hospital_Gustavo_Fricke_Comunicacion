# Hospital Gustavo Fricke — Comunicación (WhatsApp E2E)

## Requisitos
- Node 18+ (con `fetch` global). Probado en Node 22.
- Postgres en `.env` ya configurado para `apps/backend`.

## Flujo de trabajo (dev)

### 0) Reset DB (opcional)
```bash
npm run db:reset
npm run db:migrate
npm run studio
```
# Levantar servicios
npm run dev:back
npm run dev:gateway
npm run tunnel

npm run verify:webhook
### Debe imprimir: 123

# Enviar OUTBOUND (a una cita real)
CITA_ID=1 TO_PHONE=569XXXXXXXX npm run test:outbound

# Responder desde el celu

# Consultas útiles
# Historial completo
curl "http://localhost:8000/api/bot/messages?citaId=1"

# Estado de confirmación actual
curl "http://localhost:8000/api/appointments/1/confirmation"

# Pruebas locales
npm run test:webhook:text
CITA_ID=1 npm run test:webhook:button
