# Owner Portal Features

## Implemented with authoritative APIs

- Secure owner sign-in, refresh, logout, and session-expiry handling
- Responsive application shell, breadcrumbs, states, table and status patterns
- Executive snapshot from bounded organization, clinic, doctor, appointment, and billing-plan reads
- Organization list and idempotent creation
- Clinic list and idempotent creation under an active organization
- Global doctor directory
- Global appointment monitoring window without lifecycle overrides
- Billing plan directory
- Backend liveness and database-readiness display

## Intentionally deferred pending backend contracts

- Global staff directory and membership administration
- Privacy-minimized global patient directory
- Read-only global live-queue observation
- Cross-organization billing aggregates, ledger selection, and statement workflow UI
- Efficient aggregate analytics
- Privacy-safe immutable audit viewer
- Document metadata and object-storage domain
- Owner-editable platform settings
- Global search
- Doctor and staff creation

These sections render explicit explanatory states. They contain no mock totals, demo identities, fake toggles, or simulated mutations.

## Existing API dependencies

- `/api/v1/auth/login`, `/refresh`, `/logout`, `/logout-all`
- `/api/v1/administration/organizations`
- `/api/v1/administration/clinics`
- `/api/v1/doctors`
- `/api/v1/appointments`
- `/api/v1/billing/plans`
- `/api/v1/health/live`, `/health/ready`

No backend endpoint, OpenAPI contract, Prisma schema, or database migration was added in the foundation slice.
