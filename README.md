### Requisitos
- Node 20+ / npm
- Postgres 15/16
- (PowerShell) Set-ExecutionPolicy RemoteSigned -Scope CurrentUser o usar npm.cmd

### backend
- npm run prisma:gen
- npm run prisma:mig
- npm run db:seed
- npm run dev:back

### frontend
npm run dev:front

### bot-gateway (opcional)
npm run dev:bot

### .Env
- apps/backend/.env → DATABASE_URL=..., PORT=8000
- apps/frontend/.env → VITE_API_BASE_URL=http://localhost:8000
- apps/bot-gateway/.env → PORT, META_* (no se commitea)
