# backend

Ubicación: `Hospital_Gustavo_Fricke_Comunicacion/apps/backend`

Stack: Express, Prisma, Zod, Prisma schema, JS sources

## Scripts
- `// === Dev / Run ===` → ``
- `dev` → `nodemon src/server.js`
- `dev:debug` → `node --inspect=0.0.0.0:9229 src/server.js`
- `start` → `node src/server.js`
- `build` → `echo "(sin build)"`
- `test` → `echo "(sin tests por ahora)" && exit 0`
- `// === Prisma ===` → ``
- `prisma:generate` → `prisma generate`
- `prisma:migrate` → `prisma migrate dev`
- `prisma:deploy` → `prisma migrate deploy`
- `prisma:studio` → `prisma studio`
- `prisma:reset` → `prisma migrate reset --force`
- `prisma:seed` → `node prisma/seed.js`
- `// === Datos / Seeds ===` → ``
- `db:seed` → `prisma db seed`
- `import:staging` → `node src/db/import_excel_to_staging.js`
- `// === Flujos de demo ===` → ``
- `flow:doctores` → `node scripts/demo_flow_create_doctors.js`
- `flow:citas` → `node scripts/demo_flow_create_appointment.js`
- `flow:bot` → `node scripts/demo_flow_send_reminder.js`

## Desarrollo

```bash
pnpm install
pnpm dev
```

### .env
```
PORT=8000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://hgf:0000@localhost:5432/hgf_dev?schema=public"
PRISMA_MIGRATE_SHADOW_DATABASE_URL="postgresql://hgf:0000@localhost:5432/hgf_dev_shadow?schema=public"
WHATSAPP_TOKEN=EAAPcFHLFxk4BPgbS4RKu4Qy5AUSlRDC2kAKDPb3mrcOvZC7Qr8RUTUvjPdHna9ZBxfUTiA0ZADed3ZBjDFAeltxHAZA0WWBO5luwqklQ4lZBV2h7c3uphYQtsrOTqsC27v1ckZBgnKnZC3kZAT3tJx1fohhqsPcsx1IkEbCyuZBhaZBFy5JE97UlY7QWIVI12soUMbleAZDZD
WHATSAPP_PHONE_NUMBER_ID=733696073164766
WHATSAPP_API_BASE=https://graph.facebook.com/v23.0
```


## Notas
- Mantenga sincronizados DTO/Contracts entre front y back.
