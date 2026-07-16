# Doctor Settings Architecture

## Projection model

`DoctorSettingsRepository → GetDoctorSettings → DoctorSettingsProjection → DoctorSettingsView`

The repository owns read-only profile placeholders, clinic metadata, preference defaults, portal metadata, and support identifiers. The application service combines that source with shared doctor-session and appointment projections. The page never imports mock fixtures.

## Environment visibility

The public projection always contains the normalized environment, portal version, build mode, and localization date. Mock-session state and repository mode are added only when the composition environment is explicitly `development`. Missing, unknown, QA, and production values normalize to production-safe behavior. Development fields are absent from the production projection rather than hidden in presentation.

## Future editable settings

Editable profile and preference workflows require authentication, authorization, validation, durable repositories, auditability, conflict handling, and backend integration. Disabled controls in Sprint 12I are explanatory placeholders and never write local or remote state.

## Read-only boundary

The feature defines no mutation command, API route, form submission, storage adapter, or persistence mechanism. Shared appointment, queue, and doctor-session repositories are read only through existing application services.
