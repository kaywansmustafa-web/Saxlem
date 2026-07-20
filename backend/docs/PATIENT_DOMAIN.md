# Patient Domain Foundation

Sprint 13D makes the backend authoritative for a patient account, its self and family-member profiles, family relationships, and current active patient. It does not migrate Flutter repositories or implement appointments, queues, notifications, or medical data.

## Architecture

`PatientsController -> PatientService -> PatientRepository -> PrismaPatientRepository`

Controllers authenticate a patient JWT and require `patient:self`. The service applies ownership and lifecycle rules. Every repository query includes the authenticated account identifier; callers cannot supply an account or tenant identifier. Immutable projections are returned to presentation.

## Compatibility

The database stores the domain relationship `self`; API projections expose `me` to match Flutter's existing `PatientRelationship.me`. Gender includes `female`, `male`, and `unspecified`, and dates use ISO `YYYY-MM-DD`.

## Invariants

- The first profile is Self and becomes active atomically.
- A partial unique database index permits at most one Self relationship per account.
- Composite foreign keys prevent cross-account relationship and active-profile references.
- Self cannot be archived or reassigned. Relationships cannot be changed by the update API.
- Archive is a status/version update; rows are never deleted.
- An archived or foreign profile cannot become active.
- Updating and archiving require the current positive version.
- Archiving the current patient requires selecting another active patient first.

## Audit and privacy

Create, update, archive, and active-profile changes write an audit event in the same database transaction. Audit records contain action, actor, target identifier, outcome, request identifier, and time only; names, birth dates, gender, and phone numbers are excluded.
