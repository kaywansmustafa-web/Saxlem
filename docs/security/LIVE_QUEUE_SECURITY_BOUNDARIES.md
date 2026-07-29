# Live Queue Security Boundaries

## Scope

The Live Queue is an authoritative tenant-scoped aggregate. REST and database
snapshots are authoritative. Realtime delivery is explicitly out of scope.

## Authorization

- Patients may read only the queue status attached to an appointment owned by
  their patient account.
- Receptionists and clinic managers require a matching organization and clinic.
- Doctors require all three: linked doctor identity, matching organization, and
  matching clinic, plus an active doctor-clinic assignment.
- Platform administrators may read operational state but may not issue routine
  queue mutations.
- A scoped resource mismatch is reported as a privacy-safe `404`.

Capability checks at the controller are defense in depth. The application
service repeats mutation policy and the repository scopes every query.

## Lock protocol

Queue commands lock in this order:

1. idempotency key advisory lock;
2. queue aggregate advisory lock;
3. queue session;
4. appointment;
5. arrival;
6. organization;
7. clinic;
8. doctor;
9. doctor-clinic assignment;
10. organization-patient registration;
11. patient profile.

Eligibility is re-read after locks. Cancellation and patient deactivation lock
the same eligibility row and reject changes while unresolved queue work exists.
Database triggers reject deactivation or eligibility removal that would
invalidate an unresolved queue entry.

## Database and runtime defense

Session and entry identity, versions, transition graphs, timestamps, recall
deadline, unresolved close, ticket positivity, ticket immutability, and deferred
ticket-counter coherence are enforced in PostgreSQL. Trigger functions use a
fixed `pg_catalog, public` search path. Queue history is append-only and history
references use organization, clinic, session, and entry composite keys.

The runtime role has `SELECT`, narrow queue lifecycle column updates, and
append-only history inserts. Physical deletion and generic history mutation are
revoked. Direct session/entry insertion is revoked; fixed-signature
`SECURITY DEFINER` creation functions validate tenant and participant
relationships, use a fixed search path, and are executable only by the runtime
role. Deferred checks require activity, queue audit, global audit, and outbox
side effects before a mutation can commit. The migration role remains separate.

## Privacy and idempotency

Controllers map repository projections to explicit patient and staff DTOs.
Patient contracts never expose another patient. Staff queue summaries omit
organization IDs and storage-only patient IDs. The generic idempotency record
stores a purpose-specific redacted replay result: no name, patient profile ID,
appointment storage ID, visit reason, phone number, notes, or waiting list.
Queue command records expire after 24 hours and may be removed after expiry.

PostgreSQL 17 has no clean native UUIDv7 function, so records created inside the
database command functions use the built-in random UUID fallback. Prisma-created
records retain UUIDv7. This exception can be removed after a database upgrade
with native UUIDv7 support.

## Appointment boundary

Queue infrastructure does not mutate appointment lifecycle tables directly.
Completion calls a transaction-aware Appointment Domain port in the same
database transaction. Both `scheduled` and `confirmed` may transition directly
to `completed`; the prior state is captured in the exact appointment event and
mandatory audit. Appointment and queue events, audits, outbox rows, idempotency,
and state changes commit or roll back together.

## Error and retry policy

Known lifecycle, uniqueness, and version conflicts return `409`. Invalid
cursors and inputs return `400`. Deadlock and serialization failures are retried
at most twice, using the same transaction and idempotency identity; exhaustion
returns retryable `503`. Unknown database details are never placed in responses.

## Explicit exclusions

Realtime, notifications, queue mutation by platform administrators, physical
history deletion, and generic queue patch routes are not implemented.
