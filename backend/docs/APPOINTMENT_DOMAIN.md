# Appointment Domain Foundation

Sprint 13G establishes the authoritative appointment aggregate without arrival, queue, consultation, notification, billing, payment, realtime, or schedule-administration behavior.

## Trusted pricing boundary

Clients cannot submit or override fees. Until the pricing domain exists, creation snapshots the positive `APPOINTMENT_FOUNDATION_FEE_IQD` configuration value (default 25,000 IQD). This is a trusted temporary source, not a permanent tariff model; only the stored snapshot is returned.

## Lifecycle and concurrency

The exact persisted states are `scheduled`, `confirmed`, `cancelled`, `completed`, and `noShow`. Allowed status edges are `scheduled -> confirmed|cancelled|noShow` and `confirmed -> cancelled|completed|noShow`. Terminal states cannot be changed. Protected fields are clinic, doctor, patient, type, reason, start/end, duration, fee, status, and cancellation details. Their database trigger requires exactly `OLD.version + 1`; repository commands also compare the caller's expected version. Every successful command appends an appointment event and mandatory audit event in the same transaction.

## Booking

Creation validates active organization, clinic, doctor, clinic assignment, patient registration, patient ownership, duration, configurable past-time tolerance, and the existing Doctor Schedule service. A transaction-scoped advisory lock keyed by organization and doctor serializes booking with schedule, leave, holiday, exception, clinic-hours, assignment, clinic-status, and doctor-status changes. Context and schedule are revalidated after acquiring the lock and immediately before insert. PostgreSQL exclusion constraints remain the final protection against doctor and patient overlaps. Future schedule commands must participate in this same lock protocol.

References use immutable `SX-YYYY-NNNNNN` values generated only by a non-cycling database sequence. Supplied values and physical deletion are rejected. Sequence gaps are expected after rolled-back transactions; values are never recycled after cancellation or archival.

## Idempotency and listing

Every mutation requires an 8–128 character printable ASCII `Idempotency-Key`, scoped by actor and operation. The SHA-256 request fingerprint and authoritative response are stored transactionally. An identical replay returns the original response; reuse with another request returns 409. Failed transactions leave no idempotency success record.

Lists require an explicit positive date window of at most 366 days, use a maximum page size of 50, an optional allowlisted status, UUID cursor, and deterministic status/start/id ordering. Scheduled and confirmed appointments precede historical states. Staff list reads create one minimal page-level audit per represented clinic, with count only and no PHI.

## Authorization and audit

Patients are repository-scoped through their patient account; doctors through their staff-linked doctor; ordinary staff through organization and clinic; platform administrators may cross tenants. Staff reads fail closed if `appointment.viewed` cannot be recorded. Commands atomically record an appointment event and minimal audit event without PHI payloads.

All API date-times require full ISO-8601 with `Z` or an explicit offset and are persisted as UTC `timestamptz`. The offset makes repeated local hours unambiguous. For a non-UTC offset, the submitted wall-clock label must round-trip through the clinic's IANA timezone; nonexistent DST-gap times and incorrect offsets are rejected. `Z` values are treated as authoritative UTC instants. The default past tolerance is two minutes and can be configured with `APPOINTMENT_PAST_TOLERANCE_MINUTES` from zero through sixty.

Tenant/clinic mismatch for authenticated staff is 403. Patient ownership failures remain non-enumerating. Properly scoped staff may receive sanitized inactive-participant diagnostics. Known overlap and stale-version errors are 409, mandatory audit outage is retryable 503, and unexpected database failures remain standard 500 responses.
# Queue completion boundary

Live Queue completion enters the Appointment Domain through
`AppointmentQueueCompletionPort` using the queue's existing transaction.
`scheduled` and `confirmed` appointments may transition directly to `completed`.
The prior status is preserved in `appointment.completedFromQueue`; no synthetic
confirmation transition is created. Version validation, the lifecycle event,
mandatory global audit, and appointment outbox event are atomic with queue
completion.
