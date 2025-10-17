# Hospital Gustavo Fricke – Contactabilidad (Monorepo)

Actualizado: 2025-10-17

Monorepo para **gestión de citas** y **contactabilidad** por WhatsApp.

## Estructura

```
apps/
- frontend
- backend
- bot-gateway

```

## Requisitos
- Node.js 20+
- PostgreSQL 14+
- PNPM o NPM
- Prisma CLI

## Setup

```bash
pnpm install
cp .env.example .env  # complete variables
pnpm prisma generate
pnpm prisma migrate dev
pnpm -r dev           # o levante cada app por separado
```

## Convenciones
- Contracts/DTOs validados con Zod en backend.
- Ramas: main, dev, feat/*, fix/*.
- Commits: formato tradicional (tipo: módulo - resumen).
- Prefijo de API: **/api** (evite duplicar `/api/api`).

## Troubleshooting
- CORS: configure ORIGIN en backend.
- Migraciones: `prisma migrate reset` en desarrollo cuando cambie enums/tablas.
- 404: valide rutas y prefijos.
