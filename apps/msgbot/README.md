# MsgBot

## Explicación aprueba de wones
- Expone un **webhook** (`/webhook/whatsapp`) que:
  - Valida el **GET de verificación** de Meta (`hub.challenge`).
  - Recibe **mensajes entrantes** (`messages`) y **estados** (`statuses`: sent/delivered/read/failed).
- Persiste todo en Postgres vía Prisma, tabla **`WhatsAppMessage`**.
- Para `statuses` usa **upsert por `messageId`** (actualiza el registro del inbound si ya existe).
*nota: Esto es para que no haya que crear 3 mesajes por "cita" y solo uno, que cambia el estado en la tabla aux*

## Cmds
# instalar deps
cd apps/msgbot
npm install

# prisma
npm run prisma:generate
npm run prisma:migrate -- -n init_msgbot_whatsapp_messages

# levantar
npm run dev

# Pruebas locales
Health: GET http://localhost:8081/health

Verificación: GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=1234

Simular inbound y status (PowerShell):

$uri = "http://localhost:8081/webhook/whatsapp"

$inbound = @'
{ "entry":[{ "changes":[{ "field":"messages","value":{
  "metadata":{"phone_number_id":"12345"},
  "messages":[{ "id":"wamid.TEST","from":"56911111111","timestamp":"1699999999","type":"text","text":{"body":"hola!"} }]
}}]}]}
'@
Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $inbound

$status = @'
{ "entry":[{ "changes":[{ "field":"messages","value":{
  "metadata":{"phone_number_id":"12345"},
  "statuses":[{ "id":"wamid.TEST","status":"delivered","timestamp":"1700000000","recipient_id":"56911111111" }]
}}]}]}
'@
Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $status

# ToDos
- Firma X-Hub-Signature-256 activada en prod + publicar con ngrok y configurar Webhooks en Meta.
- Enlazar statuses con la cola de envíos del bot (guardar waMessageId en los envíos).
- Tests integrados (e2e con Meta sandbox).
- Observabilidad (logs estructurados, alertas en failed).
- UI de auditoría en frontend (/admin/whatsapp).