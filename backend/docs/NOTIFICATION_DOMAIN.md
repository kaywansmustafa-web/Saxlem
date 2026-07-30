# Notification Domain

Sprint 13J projects an explicit allowlist of committed Live Queue outbox events
into a durable, recipient-specific inbox. Queue commands do not depend on
notification delivery. PostgreSQL and the existing REST queue snapshots remain
authoritative; notifications only indicate that relevant queue state changed.

## Outbox semantics

Each application instance may run the bounded projector. It selects one eligible
supported event in a short transaction using `FOR UPDATE SKIP LOCKED`, validates
the stored scope, resolves recipients from current authoritative relationships,
acquires transaction-scoped recipient advisory locks in deterministic user-ID
order, inserts notifications, and marks the event published. Recipient locks
serialize sequence allocation and commit order for overlapping recipients while
allowing unrelated recipients to progress concurrently. The unique source-event,
recipient, and type key makes replay idempotent.

After recipient locks, projection locks eligibility rows in one global order:
users, patient accounts, patient profiles, organization registrations, staff
accounts, clinic memberships, doctors, doctor assignments, organization, then
clinic. UUID ordering is deterministic within each type. Eligibility is re-read
after every lock is held, and candidates that are no longer eligible are
removed before notification insertion.

Unsupported events are not selected or published. A valid event with no active
recipients is considered successfully projected and is published without an
inbox row. Projection failures roll back publication. Retriable failures use
bounded exponential backoff with jitter. Exhausted events receive a sanitized
terminal code, and later events remain eligible.

The lifecycle loop catches projection and retry-bookkeeping failures separately,
waits for the configured bounded poll interval, and continues unless shutdown
was requested. Shutdown aborts the wait and does not claim new work.

## Legacy records

The Sprint 13J migration keeps valid scoped legacy notifications active and
creates distinct synthetic outbox sources for them. Legacy rows with missing
organization or clinic scope are preserved in `notification_record_archive`.
They are not visible to the inbox or stream, and the runtime role has no read or
mutation access to the archive.

## Supported events

- `queue.session.opened`
- `queue.session.paused`
- `queue.session.resumed`
- `queue.session.closed`
- `queue.entry.enqueued`
- `queue.patient.called`
- `queue.patient.recalled`
- `queue.patient.no-response`
- `queue.consultation.started`
- `queue.consultation.completed`

`appointment.completedFromQueue` is intentionally excluded to avoid duplicate
consultation-completion notifications.

## Recipients

Patients are resolved through the queue entry and patient account. Doctors are
resolved through the exact active clinic assignment and staff account. Active
receptionists and clinic managers are resolved through exact organization and
clinic membership. Platform administrators receive no routine notifications.

## Configuration

All worker, retry, polling, heartbeat, connection-lifetime, page-size, and
backlog limits are typed and bounded in backend configuration. The worker is
disabled by default and must be enabled explicitly.

Redis may later reduce polling and provide cross-instance wake-up fan-out. It
must remain an optimization; persisted notifications remain the recovery source.
