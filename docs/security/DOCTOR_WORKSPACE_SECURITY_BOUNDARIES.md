# Doctor Workspace Security Boundaries

- The mock doctor session exists only when `SAXLEM_PORTAL_ENV=development` and `SAXLEM_MOCK_DOCTOR_SESSION=enabled` are both explicit.
- Missing, unknown, QA, and production environment values fail closed.
- Route handlers verify the doctor session and session identifier before application services execute.
- Composition checks role, clinic, and doctor scope. Hiding receptionist links is not treated as authorization.
- Doctor navigation exposes only Workspace, Patients Today, Schedule, Notifications, and Settings. Only Workspace is functional in Sprint 12F.
- Doctor projection data excludes diagnoses, prescriptions, medical history, sensitive notes, billing, and administrative information.

Real authentication, signed claims, durable audit logs, record-level authorization, session expiry, CSRF policy, and backend enforcement are required before production clinical use.
