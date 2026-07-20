# Doctor Domain Foundation

Sprint 13E makes the backend authoritative for doctors, canonical specialties, clinic assignments, professional profiles, and read-only availability metadata. It does not introduce appointment scheduling, queues, consultations, or frontend migration.

## Architecture

`DoctorsController -> DoctorService -> DoctorRepository -> PrismaDoctorRepository`

Pages and controllers never read persistence or mock data directly. All returned projections are immutable.

## Visibility and tenancy

- Patients can read a doctor only when the doctor, organization, at least one clinic assignment, and at least one specialty assignment are all active.
- Public responses expose active clinic and specialty assignments only. If the stored primary specialty is inactive, the first active specialty in the stable ordering becomes the response primary; inactive assignments never leak.
- Patient requests cannot select inactive or archived doctors, inactive organizations, or doctors whose only clinic or specialty assignments are inactive.
- Receptionists, doctors, and clinic managers are restricted to the active organization and active clinic in their authenticated JWT tenant. Default staff queries exclude inactive organizations and clinics.
- Platform administrators may read active records across organizations, but the same doctor, organization, clinic, specialty, and archive visibility rules apply.
- Archived doctors are never returned.
- Staff reads use a distinct audit action for each surface: `doctor.details.viewed`, `doctor.profile.viewed`, `doctor.specialties.viewed`, and `doctor.availability.viewed`. Patient discovery views are deliberately not audited.
- Sensitive staff reads fail closed with a retryable `503 Service Unavailable` when the mandatory audit event cannot be written. The API never returns the protected payload without its audit record.

## API boundary

- List, detail, professional profile, specialty, and availability endpoints use purpose-specific response DTOs.
- Public DTOs never expose organization identifiers, object-storage keys, concurrency versions, or internal creation/update timestamps. `profileImageUrl` is the only image field and is currently `null` until signed/public image delivery is approved.
- Availability keeps its own `updatedAt` because freshness is part of the patient-facing availability meaning.
- Search names are Unicode-preserving, trimmed, non-empty, and length-bounded. Pagination is restricted to page `1..10000` and page size `1..100`; unsafe integers are rejected.
- All documented errors use the standard Saxlem error envelope. Missing doctors return `404` consistently from details, profile, specialties, and availability surfaces.

## Role behavior

| Principal | Doctor visibility | Tenant scope | Read audit |
| --- | --- | --- | --- |
| Patient | Active public records only | Cross-organization discovery | No |
| Doctor | Active records only | Own active organization and clinic | Yes |
| Receptionist / clinic manager | Active records only | Assigned active organization and clinic | Yes |
| Platform administrator | Active records only | Cross-organization | Yes |

## Invariants

- Every doctor belongs to exactly one organization and at least one clinic in that organization.
- Composite foreign keys prevent cross-organization clinic assignments and schedule references.
- License numbers are unique inside an organization.
- Doctors and clinic assignments use UUID identifiers; Prisma generates UUIDv7 for new domain records. Legacy specialty backfill uses PostgreSQL's safe random UUID fallback because PostgreSQL 17 does not expose native UUIDv7 generation.
- Doctors use optimistic-concurrency versions and soft deletion. A database trigger prevents physical deletion.
- Inactive or archived doctors cannot have `available` availability metadata.
- Availability is descriptive metadata only and is not a schedule.

## Flutter compatibility

Responses retain `fullName`, primary `specialty`, and nullable `profileImageUrl` aliases. The richer backend profile adds canonical specialties, clinic references, professional information, and availability without requiring Flutter changes in this sprint.
