# Backend Local Development

## Local database

Docker Desktop with WSL 2 is now verified. Use the PostgreSQL-only Compose setup
documented in `LOCAL_DATABASE.md`.

## Simplest recommended setup

1. Start Docker Desktop and confirm `docker version` shows Client and Server.
2. Confirm `wsl --status` reports default version 2.
3. Run `npm run db:up`.
5. Copy `backend/.env.example` to a local ignored `.env` and replace secrets.
6. From `backend/`, run `npm install`, `npm run prisma:generate`, apply migrations,
   and start NestJS with `npm run start:dev`.

Until the Compose file is approved, a native PostgreSQL installation is the
fallback. Use a non-administrator database role and separate development and test
databases. Never connect local tests to production data.

## Available commands

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run prisma:validate`
- `npm run openapi:generate`
- `npm run openapi:validate`
- `npm run build`

Database commands enforce local database-name safety before destructive work.
