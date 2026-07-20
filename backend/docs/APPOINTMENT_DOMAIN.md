# Appointment Domain Foundation

Sprint 13G establishes the authoritative appointment aggregate without arrival, queue, consultation, notification, billing, payment, realtime, or schedule-administration behavior.

## Lifecycle

The exact persisted states are `scheduled`, `confirmed`, `cancelled`, `completed`, and `noShow`. No automatic transition exists. Safe metadata updates change only the reason; cancellation and rescheduling use dedicated commands and require the current optimistic `version`.

## Booking

Creation validates active organization, clinic, doctor, clinic assignment, patient registration, patient ownership, duration, configurable past-time tolerance, and the existing Doctor Schedule service. The complete interval must fit effective working time and cannot intersect breaks, leave, holidays, or closed exceptions. Working exceptions fully define valid exceptional time. PostgreSQL exclusion constraints independently prevent active doctor and patient overlaps.

References use the immutable `SX-YYYY-NNNNNN` form backed by a non-cycling database sequence. Values are unique and never reused.

## Authorization and audit

Patients are repository-scoped through their patient account; doctors through their staff-linked doctor; ordinary staff through organization and clinic; platform administrators may cross tenants. Staff reads fail closed if `appointment.viewed` cannot be recorded. Commands atomically record an appointment event and minimal audit event without PHI payloads.

All instants are UTC `timestamptz`. Clinic-local interpretation is delegated to the existing schedule foundation. The default past tolerance is two minutes and can be configured with `APPOINTMENT_PAST_TOLERANCE_MINUTES` from zero through sixty.
