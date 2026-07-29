# Live Queue API

All routes are under `/api/v1`, require bearer authentication, and return the
standard Saxlem error envelope. Every POST requires `Idempotency-Key` (8–128
printable ASCII characters) and an expected positive version.

## Reads

- `GET /queue-sessions/:id`
- `GET /queue-sessions/:id/entries`
- `GET /appointments/:appointmentId/queue-status`
- `GET /clinics/:clinicId/doctors/:doctorId/queue-session/current`

The appointment status route is patient-safe and self-scoped. Staff routes
return a purpose-specific bounded snapshot.

## Commands

- `POST /clinics/:clinicId/doctors/:doctorId/queue-sessions/open`
- `POST /queue-sessions/:id/enqueue`
- `POST /queue-sessions/:id/pause`
- `POST /queue-sessions/:id/resume`
- `POST /queue-sessions/:id/close`
- `POST /queue-sessions/:id/call-next`
- `POST /queue-sessions/:id/entries/:entryId/recall`
- `POST /queue-sessions/:id/entries/:entryId/no-response`
- `POST /queue-sessions/:id/entries/:entryId/start-consultation`
- `POST /queue-sessions/:id/entries/:entryId/complete-consultation`

There is no generic PATCH, reordering, removal, automatic call-next, or
arrival-created queue entry.

## Failure semantics

- `400`: validation or malformed idempotency/version input
- `401`: missing or invalid authentication
- `403`: capability or tenant context rejected
- `404`: queue/entry/appointment hidden or absent
- `409`: stale version, invalid lifecycle, duplicate eligibility, conflicting
  idempotency key, current-patient conflict, or unresolved close
- `429`: global rate policy (reserved by the common API contract)
- `503`: mandatory audit/configuration dependency unavailable
- `500`: standard unexpected-error envelope

An identical completed replay returns its original authoritative response. A
key reused with a different request fingerprint returns deterministic `409`.
Ticket numbers are permanent and are not reused.

# Live Queue API

All routes are under `/api/v1`.

- `GET /queue-sessions/{id}` returns the explicit staff session summary.
- `GET /queue-sessions/{id}/entries` uses bounded cursor pagination. `pageSize`
  defaults to 25 and is limited to 1–100. Cursors are opaque and session-bound.
  Terminal entries are excluded unless `includeTerminal=true`.
- `GET /appointments/{appointmentId}/queue-status` returns the patient allowlist.
- `GET /clinics/{clinicId}/doctors/{doctorId}/queue-session/current` preserves
  an active session across clinic timezone changes.

Every `POST` command requires an `Idempotency-Key` of 8–128 printable ASCII
characters and a positive expected version. GET routes do not accept or
advertise this header. Same-key identical replay returns the original redacted
outcome; conflicting reuse returns `409`.

Opening with a new key when a session is already open is a deterministic `409`,
regardless of version. A same-key replay is returned before this rule.

`enqueue` is a commutative append operation. The version field remains required
and must be a positive integer, but two independent eligible enqueues may both
serialize and succeed even when they supplied the same initial queue version.
The server revalidates the locked authoritative queue and every eligibility
participant before ticket allocation. This exception does not apply to any
other queue mutation.
