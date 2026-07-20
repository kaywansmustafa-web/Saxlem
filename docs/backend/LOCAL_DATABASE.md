# Local PostgreSQL

Saxlem uses two PostgreSQL 17.6 containers. `saxlem-postgres-development` binds
only to `127.0.0.1:5433` and keeps data in a named volume. `saxlem-postgres-test`
binds only to `127.0.0.1:5434` and stores data in disposable tmpfs.

Create `backend/.env` from `.env.example` and replace every placeholder. The file
is ignored. Development separates `MIGRATION_DATABASE_URL` (admin migrations)
from `DATABASE_URL` (least-privileged runtime). Never give the runtime role schema
drop, database creation, role management, or migration authority.

From `backend/` in PowerShell:

```powershell
npm run db:up
npm run db:logs
npm run db:migrate
npm run db:seed
npm run test:integration
npm run db:test:reset
npm run db:backup:rehearse
npm run db:down
```

`db:test:reset` rejects empty, remote, unknown, development, and production-like
database targets. Development has no generic reset command; the one explicit reset
performed during Sprint 13B was limited to the new local database.
