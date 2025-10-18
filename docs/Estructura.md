# Arquitectura y flujo de datos

## Capas
- **frontend**: UI (no se toca en este feature).
- **backend**: REST API + DB (Prisma/Postgres).
  - Endpoints:
    - `POST /api/bot/outbound` → envía WhatsApp (plantilla + botones) y guarda `BotMessage(OUTBOUND)`.
    - `POST /api/bot/events` → ingesta de webhooks (RAW o normalizado). Crea/actualiza `BotMessage(INBOUND)` y `CitaConfirmation`.
    - `GET /api/bot/messages?citaId=...` → historial por cita.
    - `GET /api/appointments/:id/confirmation` → estado de confirmación.
    - (Opcional) `POST /api/citas/:id/notify` → disparar por `citaId`.
- **bot-gateway**: expone webhook público y reenvía al backend local.
  - `GET /webhooks/whatsapp` → verificación (hub.challenge).
  - `POST /webhooks/whatsapp` → recibe webhook de Meta y hace forward a `BACKEND_URL/api/bot/events`.
  - `Prueba-05.js` → envío a Meta (retorna `wamidTemplate` y `wamidInteractive`).

## Flujo (OUT → IN)
1. Backend `POST /api/bot/outbound`:
   - Arma texto y llama `enviarRecordatorio`.
   - Se registran **dos** mensajes en Meta (plantilla y botones). Trackeamos el **interactivo** (`providerMessageId`).
   - Guarda `BotMessage(OUTBOUND)` con `status=PENDING`.
   - Upsert `CitaConfirmation(PENDING)`.

2. Paciente responde:
   - Meta golpea `POST /webhooks/whatsapp` (gateway).
   - Gateway reenvía a `POST /api/bot/events` (backend).
   - Backend normaliza:
     - Si `interactive.button_reply.id` es `"CONFIRMAR:<citaId>"` → estado `CONFIRMED`.
     - Si `"RECHAZAR:<citaId>"` → `REJECTED`.
     - Si texto libre → `UNKNOWN` (salvo que haya `context.id` para enlazar).
   - Guarda `BotMessage(INBOUND)` con `status=REPLIED`.
   - Upsert `CitaConfirmation`.

## DB
- `BotMessage`: log de mensajería (IN/OUT). Unicidad por `providerMessageId`.
- `CitaConfirmation`: estado agregado por cita.
- (Legacy) `WhatsAppMessage`: se puede deprecar si no se usa.

## Idempotencia
- La ingesta hace *update-or-create* por `providerMessageId` para tolerar **reintentos** de WhatsApp.
- Envío OUT marca OUT previos `PENDING` como `DELIVERED` (opcional, activado).

## Seguridad
- En dev **no** validamos firma HMAC del webhook para simplificar.
- En prod: activar verificación de `X-Hub-Signature-256` y `APP_SECRET`.