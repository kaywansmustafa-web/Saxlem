# Live Queue Domain

## Scope

Sprint 13I establishes the authoritative, REST-only Live Queue domain. Arrival and
queueing remain separate: recording an arrival never creates a queue entry. An
authorized queue command must explicitly enqueue an eligible `queueReady`
arrival.

The aggregate is one doctor queue per organization, clinic, and clinic-local
operational date. Sessions follow `notStarted → open ↔ paused → closed`.
Entries follow `waiting → called → inConsultation → completed`, with
`called → noResponse → called` allowed only during the configured recall grace
period. `removed` is reserved and has no API command.

## Invariants

- Tickets begin at 1, are allocated atomically from `next_ticket`, increase
  monotonically, and are never reused.
- Appointment time never changes ticket order.
- A PostgreSQL partial unique index permits only one `called` or
  `inConsultation` entry per session.
- Session and entry lifecycle triggers enforce exact transitions, immutable
  identity/tickets, positive sequential versions, no physical deletion, and
  append-only operational history.
- Every mutation requires an idempotency key and expected version, runs in one
  PostgreSQL transaction, writes queue activity, mandatory audit, global audit,
  and an outbox event.
- Advisory locks use a stable queue aggregate key. The database constraints are
  the final race-safety boundary.
- Consultation completion updates the related appointment and appends an
  appointment event in the same transaction. This is the narrow queue-to-
  appointment completion boundary; no generic appointment write endpoint is
  exposed.

## Authorization and privacy

Patients can read only their own status. Their DTO contains ticket, current
ticket, count ahead, an estimate range, health, references, and calm guidance;
it contains no other patient identity or clinical reason.

Receptionists and clinic managers operate only inside the token tenant/clinic.
Doctors are additionally scoped through their staff-linked doctor assignment
and cannot enqueue. Platform administrators can inspect across tenants but
cannot mutate without a future support-elevation design. Foreign resources use
privacy-safe not-found responses where applicable.

## Health and wait estimates

Waits are ranges derived from current remaining consultation time, patients
ahead, and the rolling session average. The configured fallback is used when
there is no completed consultation history. Health thresholds default to
healthy through 10 minutes behind, busy through 25, and delayed thereafter.
Paused queues preserve position but suspend estimates.

Configuration:

- `QUEUE_RECALL_GRACE_MINUTES=5`
- `QUEUE_HEALTH_BUSY_THRESHOLD_MINUTES=10`
- `QUEUE_HEALTH_DELAYED_THRESHOLD_MINUTES=25`
- `QUEUE_FALLBACK_CONSULTATION_MINUTES=20`

## Offline and future realtime contract

Clients may show a timestamped last-known snapshot. Unsafe commands must be
disabled offline and must never be silently queued. Reconnection reloads the
authoritative REST/database state. Explicit retries reuse the idempotency key;
stale versions are rejected. Enqueue is the deliberate exception to strict
optimistic-version rejection: it is a commutative append. Its positive integer
`expectedVersion` remains input-validated, but an independent enqueue advancing
the session version is not by itself a conflict. Enqueue still serializes on
the authoritative queue lock, locks the appointment, arrival, organization,
clinic, doctor, assignment, registration, and patient, then re-reads queue
state and eligibility before allocating a ticket. Closed or newly ineligible
state always rejects the command. All noncommutative commands retain strict
version matching. No SSE, WebSocket, Redis, or client polling is
implemented. Transactional outbox events reserve the future SSE integration.

## Operational notes

Mandatory audit failure rolls the transaction back and returns a retryable 503.
Audit/outbox metadata excludes patient names, phone numbers, visit reasons, and
medical data. Staff waiting lists are bounded to 50 entries and recent activity
to 20 records.

# Live Queue Domain

The queue is one tenant-scoped aggregate per doctor, clinic, organization, and
operational date. Each session snapshots `effective_timezone`; later clinic
timezone changes do not reinterpret an existing workday. Current lookup returns
an already active session before calculating a new operational date.

Session transitions are `notStarted → open`, `open ↔ paused`, and
`open|paused → closed`. Closed is terminal and unresolved entries prevent close.
Entry transitions are `waiting → called`, `called → inConsultation|noResponse`,
`noResponse → called` through the inclusive database recall deadline, and
`inConsultation → completed`.

The recall grace duration is validated configuration, snapshotted on session
creation, and immutable. PostgreSQL assigns `no_response_at` and the inclusive
recall deadline from database time; clients cannot extend it.

Ticket allocation inserts the current `next_ticket` and advances the counter
exactly once in the same transaction. Deferred PostgreSQL validation requires
the counter to equal the maximum committed ticket plus one.

Queue health is session-level: healthy through 10 minutes behind, busy from 11
through 25, and delayed above 25. A patient wait is the current consultation's
estimated remaining time plus the expected duration of waiting entries ahead.
The current entry is counted exactly once. Paused queues suspend estimates.

See `docs/security/LIVE_QUEUE_SECURITY_BOUNDARIES.md` for authorization, locks,
database defense, privacy, and failure behavior.
