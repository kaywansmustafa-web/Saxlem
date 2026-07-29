# Backend Security Baseline

Sprint 13A establishes interfaces, not authentication implementations.

Patients will use normalized Iraqi phone numbers and expiring hashed OTP
challenges with request, attempt, device, phone, and IP limits. Staff authentication
will require a separately approved production method. No mock provider may be
composed in production.

Sessions will use short-lived access credentials and rotating opaque refresh
tokens stored as hashes. Reuse revokes the token family. Web credentials use
Secure, HttpOnly, SameSite cookies plus CSRF/origin protection; Flutter refresh
credentials remain behind secure storage.

Authorization is capability-, tenant-, resource-, and lifecycle-aware. Roles are
only capability templates. Principal, tenant, provider, session, authorization,
audit, idempotency, and outbox contracts live under `src/common`.

Logs redact authorization headers, cookies, OTPs, phone numbers, email addresses,
and set-cookie responses. Request bodies must not be logged by default. Audit
events are immutable and must never contain credentials, OTPs, or complete tokens.

Sensitive read surfaces must write a purpose-specific audit event before returning
their protected response. If the audit store is unavailable, the request fails
closed with a retryable standard `503 Service Unavailable` response; protected data
must not be returned without its mandatory audit record.

API response DTOs are purpose-specific and minimize data by default. Persistence
models, tenant identifiers not required by the caller, object-storage keys,
optimistic-concurrency versions, and internal timestamps must not cross public API
boundaries. Public image delivery uses an approved URL field, never a storage key.

Tenant authorization and lifecycle visibility are separate checks. A valid role or
tenant membership does not make an inactive organization, clinic, assignment, or
archived resource visible. Pagination and search inputs are bounded before reaching
the repository to prevent unsafe queries and resource-amplification requests.

Scheduling records are tenant-bound through composite organization, clinic,
doctor, and assignment foreign keys. Recurring rules use validated clinic IANA
timezones, while concrete leave, holiday, and exception periods use UTC instants.
Staff schedule and availability reads are mandatory-audited and fail closed when
the audit store is unavailable. Patients have descriptive availability access only;
operational schedules, breaks, leave, holidays, exceptions, and clinic-hours
projections require separate staff capabilities. Multi-clinic reads create one
minimal audit event per clinic in an atomic batch, preventing misleading tenant
attribution or partial audit success.

Appointment mutations require actor-and-operation-scoped idempotency, expected-version checks, mandatory transactional audit, and a shared doctor-schedule advisory-lock protocol. Pricing is server-controlled. Database guards prohibit caller-selected references, physical deletion, invalid lifecycle transitions, unversioned protected changes, cross-tenant appointment events, invalid duration, and malformed cancellation reasons. Only known overlap constraints map to conflict; audit outages fail closed as retryable service unavailability and unexpected persistence errors retain the standard internal-error envelope.
# Live Queue

Live Queue follows the tenant, lock, runtime-role, DTO, audit, and idempotency
boundaries in [LIVE_QUEUE_SECURITY_BOUNDARIES.md](LIVE_QUEUE_SECURITY_BOUNDARIES.md).
