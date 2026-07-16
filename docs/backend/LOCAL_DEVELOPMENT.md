# Backend Local Development

## Current constraint

Docker and PostgreSQL are not installed on the inspected Windows environment.
Do not install system software automatically.

## Simplest recommended setup

1. Install Docker Desktop for Windows manually.
2. Enable the WSL 2 engine during Docker Desktop setup.
3. Restart the terminal and confirm `docker version` works.
4. In the future infrastructure sprint, use the repository's PostgreSQL-only
   Compose service with `docker compose up -d postgres`.
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

Database migrations and integration tests require a reachable PostgreSQL server.
