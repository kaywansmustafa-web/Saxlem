# Doctor Availability and Schedule Foundation

Sprint 13F makes the backend authoritative for recurring clinic hours, doctor working periods, breaks, leave, holidays, one-off exceptions, timezone conversion, and descriptive availability. It does not create appointment slots, accept bookings, mutate queues, or expose administrative editing.

## Architecture

`Controller -> DoctorScheduleService -> immutable projection -> DoctorScheduleDtoMapper`

`DoctorScheduleService -> DoctorScheduleRepository -> PrismaDoctorScheduleRepository`

Presentation never reads Prisma models. API DTOs omit organization identifiers, record identifiers, optimistic versions, and database timestamps. Patient availability uses a separate data-minimized DTO and never serializes operational rules.

## Records

| Record | Meaning | Time representation |
| --- | --- | --- |
| `ClinicWorkingHours` | Recurring clinic opening periods | Weekday plus local wall-clock minute range |
| `DoctorWeeklySchedule` | Recurring doctor work per clinic | Weekday plus local wall-clock minute range |
| `DoctorBreak` | Recurring break inside a work period | Weekday plus local wall-clock minute range |
| `DoctorLeave` | Doctor-specific unavailability | UTC `timestamptz` range |
| `DoctorHoliday` | Named doctor/clinic holiday | UTC `timestamptz` range |
| `DoctorScheduleException` | One-off working or closed override | UTC `timestamptz` range |
| `TimezoneConfiguration` | IANA clinic timezone and conversion policy | Identifier plus UTC-storage policy |

Every mutable schedule record has an optimistic `version`. IDs are generated through Prisma UUIDv7. Concrete instants use PostgreSQL `timestamptz`; no local timestamp is stored. Recurring weekday/minute rules are intentionally wall-clock rules interpreted only in the clinic's validated IANA timezone.

## Availability semantics

Availability is descriptive and never represents a bookable slot. The internal projection distinguishes `workingToday`, `closedToday`, `onLeave`, `holiday`, and `unavailable`; the patient contract deliberately collapses internal causes to `workingToday`, `closedToday`, or `unavailable`.

Rules are evaluated in this strict order:

1. Active one-off exception
2. Active leave
3. Active holiday
4. Active weekly schedule
5. No schedule (`closedToday`)

Breaks affect `isWorkingNow` but do not change the day-level `workingToday` status. A working exception fully replaces the recurring rule for its UTC range: recurring breaks do not apply, its period is the effective working period, and it can override leave and holiday. A closed exception produces `unavailable`. Only the winning rule contributes metadata, so a lower-priority holiday name is cleared.

## Database invariants

- Weekdays are restricted to `0..6`, where Sunday is zero.
- Minute ranges are within `0..1440` and start before end.
- Concrete UTC ranges start before end.
- Active clinic hours, breaks, leave, and exceptions cannot overlap within their scope.
- A doctor's active weekly periods cannot overlap anywhere in the organization, including across clinics. Different non-overlapping clinic periods remain valid.
- Holidays are clinic-effective doctor rules; active holiday ranges for the same organization, clinic, and doctor cannot overlap. This matches repository filtering and prevents one clinic's internal holiday configuration leaking into another clinic's projection.
- Weekly work must fit inside active clinic working hours. Deferred reverse constraints also reject shrinking or disabling parent clinic hours that would strand a working period.
- Breaks must fit inside an active weekly work period. Deferred reverse constraints reject shrinking or disabling parent working periods that would strand a break. Future schedule-administration commands must update parents and children in one transaction so these deferred invariants are checked at commit.
- Composite foreign keys enforce organization, clinic, doctor, and clinic-assignment ownership.
- Only active doctors may receive active schedule records.
- Doctors with active schedule records cannot be made inactive or archived.
- Recurring rows cannot cross midnight. Overnight work is two rows: `start -> 24:00` on day one and `00:00 -> end` on the next weekday.
- Clinic timezone identifiers must exist in PostgreSQL `pg_timezone_names`. Node/ICU `Intl` is canonical at the API boundary, and readiness checks every configured active clinic zone against the deployed runtime. Deployment images must keep ICU and PostgreSQL tzdata current.

## Authorization and visibility

- Patients have `doctor:availability:read` only. They cannot read weekly schedules, breaks, leave, holidays, exceptions, operational metadata, or clinic-hours projections. Patient availability reads are not audited.
- Receptionists have tenant availability and schedule reads. Doctors have tenant availability and their own schedule only. Clinic managers additionally have tenant clinic-hours reads.
- Platform administrators may read across tenants but cannot bypass active doctor, clinic, organization, or specialty visibility.
- Foreign-tenant and lifecycle-hidden doctor schedules return `404`; explicit staff clinic mismatch returns `403`.

Staff reads are mandatory-audited as `schedule.viewed` or `availability.viewed`. Multi-clinic reads create one minimal audit event per affected clinic in one transaction. A failed audit batch fails closed with retryable `503` and no protected response.

## Read-only API

- `GET /api/v1/doctors/:id/schedule`
- `GET /api/v1/doctors/:id/availability`
- `GET /api/v1/clinics/:id/hours`

Optional `clinicId` narrows doctor availability for patients and narrows schedule/availability for platform administrators. Tenant staff are always restricted to their authenticated clinic. Optional `at` is an ISO-8601 UTC instant and defaults to the current instant.

The operational schedule projection returns every active leave, holiday, and exception overlapping `[at - 366 days, at + 366 days)`. The bounded query has no silent record cap and is complete for that window.

There are deliberately no `POST`, `PATCH`, or `DELETE` schedule routes.
