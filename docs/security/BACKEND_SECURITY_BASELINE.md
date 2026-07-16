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
