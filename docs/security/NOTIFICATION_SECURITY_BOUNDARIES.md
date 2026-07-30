# Notification Security Boundaries

Notification scope is derived from the authenticated principal and current
database relationships. Clients cannot select recipients, organizations,
clinics, or patient profiles. Every read filters by recipient user; staff and
doctor reads also require the active token tenant. Platform administrators have
no Sprint 13J notification capability.

Persisted payloads contain a stable action code only. They exclude patient
names, contact details, birth dates, appointment reasons, diagnoses, medical or
staff notes, audit metadata, credentials, tokens, secrets, and localized prose.
SSE bodies and recipient identity are not logged.

Composite foreign keys bind clinics and patient registrations to the stored
organization. Notification scope, recipient, source, type, payload, occurrence
time, creation time, and delivery sequence are immutable. Runtime SQL cannot
delete notifications or update arbitrary fields. Read state changes only
through a recipient-checking `SECURITY DEFINER` function with an explicit safe
`search_path`; `PUBLIC` execution is revoked.

Transaction-scoped advisory locks serialize delivery-sequence allocation and
commit order for every overlapping recipient set. Locks are acquired by sorted
recipient user ID to prevent deadlocks. Unscoped legacy rows are isolated in an
archive that the runtime role cannot read or mutate.

Eligibility-bearing rows are locked and revalidated before materialization.
PostgreSQL deactivation updates therefore either commit before revalidation or
wait for the projection transaction. Platform-administrator identities are
excluded even when they also hold an operational clinic membership.

Worker logs contain only source outbox ID, event type, attempt count, and a
sanitized outcome code. Mark-as-read audit contains actor and applicable tenant,
notification target, action, request ID, timestamp, and safe outcome—never the
notification payload.

No Redis, WebSockets, push notifications, email, SMS, chat, frontend delivery,
or queue mutation is introduced. PostgreSQL persistence and REST snapshots
remain authoritative.
