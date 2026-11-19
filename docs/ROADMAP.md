# Saxlem Completion Roadmap

## Status

Sprint 13U is completed and released (`v0.26.0-localization-product-polish`).
The Owner Portal workstream is in progress. Sprint 13V has not started.

- Remaining before launch: Owner Portal (OP), Sprint 13V, Sprint 13W
- Planned launch completion point: Sprint 13W

## Completed Sprints

| Sprint | Scope | Release tag |
| --- | --- | --- |
| 13K | Clinic Portal foundation, authentication, roles, navigation | `v0.16.0-clinic-portal-foundation` |
| 13L | Receptionist appointment management and patient lookup | `v0.17.0-clinic-appointments-patient-directory` |
| 13M | Arrival, check-in, and live queue operations | `v0.18.0-clinic-arrival-live-queue` |
| 13N | Doctor workspace | `v0.19.0-doctor-portal` |
| 13O | Flutter backend integration | `v0.20.0-flutter-backend-integration` |
| 13P | Doctor discovery, search, filters, profiles | `v0.21.0-doctor-discovery` |
| 13Q | Booking, rescheduling, cancellation, history | `v0.22.0-appointment-management` |
| 13R | Patient arrival, live queue, notifications | `v0.23.0-patient-queue-experience` |
| 13S | Administration and clinic onboarding | `v0.24.0-administration-onboarding` |
| 13T | Billing, commissions, statements, plans | `v0.25.0-billing` |
| 13U | Badini, Arabic, English localization; accessibility; UX polish | `v0.26.0-localization-product-polish` |

## Remaining Workstreams

### OP — Owner Portal (added explicitly after 13U)

A separate, English-only Owner/CEO control plane (`owner-portal/`) on the
existing `platformAdministrator` identity, plus the backend `platform-control`
module. Foundation is on `feature/owner-portal-foundation`; Phase 2 is on
`rescue/owner-portal-phase2-wip` (draft PR #9).

Exit criteria: Phase 2 checklist complete, privacy review passed, migrations
replay from zero on the project's PostgreSQL version, backend + Owner Portal +
Clinic Portal regression suites green, then merge and tag.

### Sprint 13V — Production Hardening

Security, performance, monitoring, backups, and production hardening.

### Sprint 13W — Pilot and Release

Deployment, pilot clinics, end-to-end testing, launch fixes, and release.
First pilot city: Duhok; Erbil follows a measured pilot.

## Completion Rule

Each sprint or workstream requires:

1. Tests
2. Review
3. A GO verdict
4. Merge to `main`
5. A release tag

## Roadmap Governance

- Scope changes must update this roadmap explicitly.
- No additional sprint may be added silently.
- Sprint 13W is the planned launch completion point.
