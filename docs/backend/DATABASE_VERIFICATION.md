# Database Verification

Sprint 13B applied the foundation migration from zero to `saxlem_development` and
`saxlem_test`, regenerated Prisma Client, seeded fictional infrastructure records,
and ran real PostgreSQL tests.

Verification covers UUIDv7 generation, UTC timestamps, tenant identifiers,
duration/fee checks, membership/reference/session/queue/token/idempotency
uniqueness, one active consultation, audit/outbox persistence, schema inventory,
and readiness success/failure.

Tenant-negative tests reject cross-organization clinic membership, doctors without
the clinic assignment, patient profiles without organization registration, and
queue entries whose session belongs to another clinic. These constraints are
defense in depth; application repository predicates and authorization remain
mandatory.

The tests revealed a genuine Sprint 13A defect: doctor, patient-profile, and queue
tenant chains were incomplete. The initial, not-yet-released migration was amended
to introduce `doctor_clinic_assignments`, `organization_patient_profiles`, and
composite tenant foreign keys. No production database had consumed that migration.
