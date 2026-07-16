# Backend Release Checklist

- Supported Node version and lockfile confirmed.
- Configuration explicitly identifies the environment and validates all secrets.
- No development or mock provider is reachable in production composition.
- TypeScript, ESLint, unit, architecture, configuration, and security tests pass.
- Prisma schema validates and generated migration has been reviewed.
- Migration and rollback/recovery procedure has been tested against PostgreSQL.
- OpenAPI generates, validates, and contains no unversioned product endpoint.
- Production build succeeds.
- Logs and error responses contain no credentials or patient data.
- Tenant isolation and authorization negative paths pass against PostgreSQL.
- Liveness and dependency-aware readiness are verified.
- Backup, PITR, retention, restore testing, RPO, and RTO are approved.
- `git diff --check` is clean.
