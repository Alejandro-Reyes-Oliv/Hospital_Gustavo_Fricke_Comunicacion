# bot-gateway

Ubicación: `Hospital_Gustavo_Fricke_Comunicacion/apps/bot-gateway`

Stack: Express, JS sources

## Scripts
- `// === Dev / Run ===` → ``
- `dev` → `nodemon --watch src --ext js,json --signal SIGTERM src/server.js`
- `start` → `node src/server.js`
- `// === Webhook público (opcional) ===` → ``
- `dev:public` → `localtunnel --port 8082 --subdomain hgf-bot`

## Desarrollo

```bash
pnpm install
pnpm dev
```

### .env
```
PORT=8082
BACKEND_URL=http://localhost:8000
VERIFY_TOKEN=dev-verify-token        # para el GET de verificación del webhook
APP_SECRET=dev-app-secret            # si verificas HMAC del POST
WHATSAPP_TOKEN=EAAPcFHLFxk4BPgbS4RKu4Qy5AUSlRDC2kAKDPb3mrcOvZC7Qr8RUTUvjPdHna9ZBxfUTiA0ZADed3ZBjDFAeltxHAZA0WWBO5luwqklQ4lZBV2h7c3uphYQtsrOTqsC27v1ckZBgnKnZC3kZAT3tJx1fohhqsPcsx1IkEbCyuZBhaZBFy5JE97UlY7QWIVI12soUMbleAZDZD
WHATSAPP_PHONE_NUMBER_ID=733696073164766
WHATSAPP_API_BASE=https://graph.facebook.com/v23.0
```


## Notas
- Mantenga sincronizados DTO/Contracts entre front y back.
