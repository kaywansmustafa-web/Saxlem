# Patient Arrival Domain

## Purpose and boundary

Patient Arrival is the authoritative record that a patient physically arrived for a scheduled appointment. It establishes future queue eligibility only. It does not create a queue entry, assign a queue number, order or call a patient, begin consultation, send notifications, or perform billing.

The implementation follows `Repository -> Application Service -> immutable Projection -> DTO Mapper -> Controller`. Presentation and application code do not expose Prisma records. Appointment existence, lifecycle access, patient ownership, doctor self-scope, and staff tenant scope are consumed through `AppointmentService`; repository predicates independently enforce the same ownership boundary.

## Data and lifecycle

Each appointment has exactly one `AppointmentArrival`, initialized with `expected`, version `1`, and no arrival timestamps. The only transitions are:

1. `expected -> arrived`: records immutable `arrivedAt` and increments the version.
2. `arrived -> queueReady`: records `queueReadyAt` and increments the version.

Both transitions and their two `ArrivalAudit` rows occur in one database transaction. A successful POST therefore returns `queueReady` at version `3`. Database triggers reject skipped or reversed transitions, unversioned changes, timestamp mutation, identity/tenant mutation, ineligible direct inserts, and physical deletion. Arrival audits are append-only, tenant/clinic-bound, unique per transition, and checked against authoritative arrival state.

All timestamps are UTC `TIMESTAMPTZ(3)`. New rows use Prisma UUIDv7. PostgreSQL 17 does not provide a safe native UUIDv7 generator, so the one-time migration backfill uses `gen_random_uuid()` (UUIDv4); this exception is isolated to pre-existing appointments and does not weaken uniqueness.

## Eligibility and arrival window

Recording requires an existing appointment in `scheduled` or `confirmed` state, matching patient ownership, matching tenant scope, and active organization, clinic, doctor, and patient profile. Cancelled, completed, and no-show appointments are rejected.

The inclusive window is computed from the appointment's UTC instant:

- `ARRIVAL_EARLY_WINDOW_MINUTES`: default `60`
- `ARRIVAL_LATE_WINDOW_MINUTES`: default `120`

Configuration accepts only integers from 0 through 1440. The client cannot supply the eligibility time. The repository compares server time with the appointment time reloaded after the appointment row is locked, so a concurrent reschedule cannot leave a stale eligibility decision. The policy is timezone-safe because persisted appointment instants and comparisons are UTC; clinic-local schedule interpretation remains owned by the Appointment/Schedule domains.

## API and authorization

- `GET /api/v1/appointments/{id}/arrival`
- `POST /api/v1/appointments/{id}/arrival`

POST requires `Idempotency-Key` (8-128 printable ASCII characters) and body `{ "version": 1 }`. There is no PATCH, DELETE, or queue endpoint.

- Patients: their own appointments only; read and record.
- Receptionists and clinic managers: current organization and clinic only; read and record.
- Doctors: appointments assigned to their doctor identity; read only.
- Platform administrators: cross-tenant read and record.

Unauthorized and foreign-scope records are not returned. JWT, principal, tenant context, and capability guards remain the API boundary, while repository predicates provide defense in depth.

## Concurrency, idempotency, and audit

Commands acquire an idempotency advisory lock and consistently ordered doctor/patient advisory locks, then lock the appointment row. Organization, clinic, doctor, and patient rows receive shared locks before final active-context and arrival-window validation, preventing concurrent deactivation from invalidating the decision before commit. Optimistic version checks and the database lifecycle trigger prevent duplicate or concurrent arrival transitions. An identical completed request replays its stored response. Reusing a key with a different request hash returns deterministic conflict; partially executing commands roll back atomically.

`arrival.recorded` is written in the command transaction. Staff `arrival.viewed` auditing is mandatory and fails closed with service unavailable. Patient reads follow the existing no-read-audit policy. Audit events contain identifiers and security context only—no appointment reason or other PHI.

## Operational notes

Runtime database grants are reapplied after migration. REST and database snapshots remain authoritative. Future queue work may consume `queueReady`, but must not reinterpret or mutate arrival history. Any future realtime transport should publish after authoritative commits and must not become a source of truth.

The runtime role may select, insert, and update arrivals, but cannot delete them. It may insert arrival audits but cannot update or delete them. Database triggers remain a second integrity boundary rather than the sole least-privilege control.
