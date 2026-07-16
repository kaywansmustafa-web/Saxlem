# Doctor Workspace Architecture

## Ownership

The doctor session repository owns only doctor-session lifecycle, version, idempotency ledger, and session activity. Sprint 12E's queue repository remains authoritative for current and waiting patients. The appointment repository remains authoritative for appointment projections. The doctor workspace never creates doctor-only copies of those aggregates.

## Lifecycle

Supported states are `active`, `paused`, and `finished`. Pause and resume delegate to shared queue operations. Complete Consultation delegates to the shared idempotent queue completion rule and therefore updates queue, appointment, patient, and dashboard reads. Finish pauses an open queue and permanently finishes the doctor session. Finished sessions reject all subsequent commands.

Every doctor command carries a doctor-session expected version and operation ID. Session transitions validate before touching the queue. Repeated operation IDs return the current immutable projection without duplicating queue or activity events.

## Time

Consultation start time is stored as an ISO-8601 UTC timestamp. Application projections receive an injected clock. The client derives a display-only elapsed duration once per minute while the session is active. Paused, completed, and finished states stop presentation updates; no timer tick enters business state or a screen-reader live region.

## Future integration

A durable implementation should coordinate session, queue, and appointment changes transactionally, publish committed events through an outbox, authorize doctor and clinic claims server-side, and reconcile realtime reconnects. Clinical records must remain a separate, audited, least-privilege bounded context.
