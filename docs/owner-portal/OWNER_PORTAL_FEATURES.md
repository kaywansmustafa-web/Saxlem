# Owner Portal Features

## Implemented with authoritative APIs

- Secure owner sign-in, refresh, logout, and session-expiry handling
- Responsive application shell, breadcrumbs, states, table and status patterns
- Executive snapshot from bounded organization, clinic, doctor, appointment, and billing-plan reads
- Organization list and idempotent creation
- Clinic list and idempotent creation under an active organization
- Global doctor directory
- Global appointment monitoring window without lifecycle overrides
- Billing plan directory
- Backend liveness and database-readiness display
- Global staff administration, status and membership controls, and secure one-time activation
- Privacy-minimized patient directory and audited detail views without clinical content
- Read-only global live operations with initials and domain-derived health semantics
- Executive analytics with real bounded date buckets and Asia/Baghdad business periods
- Privacy-safe audit log and categorized global search
- Transactional doctor onboarding, activation, detail, and optimistic editing
- Commission and statement workspaces with immutable statement finalization
- Development Document Center upload, private download, lifecycle status, and soft delete
- Read-only owner settings and environment information

## Production infrastructure deferred

- S3-compatible private object storage and production credentials
- malware scanning, retention, and backup policy for uploaded files
- secure activation delivery provider (email/SMS or equivalent)
- production monitoring, deployment, and secret-manager wiring

## Existing API dependencies

- `/api/v1/auth/login`, `/refresh`, `/logout`, `/logout-all`
- `/api/v1/administration/organizations`
- `/api/v1/administration/clinics`
- `/api/v1/doctors`
- `/api/v1/appointments`
- `/api/v1/billing/plans`
- `/api/v1/health/live`, `/health/ready`
- `/api/v1/platform/staff`, `/patients`, `/live-operations`, `/analytics/executive`
- `/api/v1/platform/audit-events`, `/search`, `/documents`, `/doctors`, `/settings`
- `/api/v1/auth/staff-activation`

The control-plane module is additive and versioned under `/api/v1`; stable DTOs are represented in the checked-in OpenAPI document.
