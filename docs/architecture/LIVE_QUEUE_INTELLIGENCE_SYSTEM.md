# Saxlem Live Queue Intelligence System

## Status

Approved architecture baseline for the patient Live Queue vertical slice and future production backend.

## Principles

- The server is authoritative for queue order, state, and version.
- Appointment, queue entry, and consultation are separate concepts.
- Every mutation is versioned, idempotent, authorized, and auditable.
- Patient projections never expose another patient's identity or clinical details.
- Queue position is operational fact; estimated wait is a prediction presented as a range.
- Clients support loading, live, action-pending, reconnecting, stale, offline, paused, closed, and failure states.

## Actors

- **Patient:** checks in, views their privacy-safe status, reports travel or delay, requests help, and receives updates.
- **Doctor:** calls the next eligible patient, starts and completes consultations, and reports pauses or delays.
- **Receptionist:** checks in patients, handles walk-ins, deferrals, no-shows, transfers, and authorized priority changes.
- **Admin:** configures clinics, roles, policies, notification rules, retention, and audit access.

## Core concepts

- **Appointment:** the planned service.
- **Queue session:** an operational queue for a doctor, service, room, and time window.
- **Queue entry:** the patient's operational state within a session.
- **Consultation:** the actual encounter timing and operational outcome.
- **Queue event:** immutable record of a state change.
- **Patient queue snapshot:** privacy-safe, versioned projection for one patient.

## Queue states

Session lifecycle:

```text
scheduled → open ↔ paused → closing → closed
```

Patient entry lifecycle:

```text
expected → checked-in → ready → called → in-consultation → completed
```

Alternative outcomes include deferred, missed-call, cancelled, no-show, and transferred. Only valid server-side transitions are accepted.

## Ordering and estimation

Ordering is deterministic by priority class, explicit operational constraints, effective scheduled time, readiness time, stable creation sequence, and entry ID. Emergency insertions require authorization and a reason.

Estimated wait combines remaining active consultation time, predicted work ahead, turnover buffers, known doctor timing, and uncertainty. Predictions are displayed as lower/upper bounds with patient-friendly confidence wording.

## Client architecture

```text
REST snapshot / realtime event
  → data source
  → repository + DTO mapper
  → privacy-safe domain snapshot
  → use cases
  → controller
  → immutable presentation state
  → page and focused widgets
```

Sprint 3A uses a controlled mock source behind the same repository contract. A rule-based guidance service generates calm contextual instructions and can later be replaced by smarter logic.

## Production backend direction

Begin with a modular monolith containing Scheduling, Queue Operations, Estimation, Notifications, Identity, and Audit modules. Use PostgreSQL for transactional state, optimistic concurrency per queue session, a transactional outbox, background workers, and WebSocket or SSE delivery. Notifications and analytics must not block queue mutations.

## Offline and realtime behavior

Every snapshot and event carries a queue version. Clients detect version gaps and refetch. Reconnecting, stale, and offline modes retain the last safe snapshot while clearly stating that it may not be current. Staff mutations with ordering impact normally require connectivity.

## Security

- OAuth/OIDC authentication and scoped role-based authorization.
- Clinic and organization isolation on every query and command.
- Encryption in transit and at rest.
- Minimal notification content.
- Non-enumerable identifiers and rate limiting.
- Immutable audit records for priority, reordering, transfer, no-show, and correction actions.

## Scalability

Partition work naturally by organization, clinic, and queue session. Serialize only conflicting mutations within a session. Use cached projections for reads and stateless realtime gateways with shared pub/sub. Extract services only after operational evidence identifies a bottleneck.

## Future intelligence

Potential capabilities include wait prediction, capacity forecasting, no-show prevention, anomaly detection, and schedule optimization. AI must remain advisory for clinically sensitive priority, with human approval, versioning, fairness testing, drift monitoring, and rollback.

## Key risks

- Estimate volatility: use ranges, confidence, and notification thresholds.
- Concurrent staff actions: optimistic concurrency and atomic call-next commands.
- Privacy leakage: purpose-built patient projections and scoped subscriptions.
- Connectivity loss: cached safe state, explicit freshness, and snapshot recovery.
- Emergency misuse: restricted roles, mandatory reasons, and audit review.
- Notification delay: expiry timestamps, deduplication, and multi-channel fallback.
