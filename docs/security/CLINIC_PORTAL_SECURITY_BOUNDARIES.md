# Clinic Portal Security Boundaries

Sprint 12A has no production identity or backend. The development receptionist session is selected only by server-side composition and is unavailable for missing, unknown, QA, or production configuration. Client presentation cannot choose a repository or enable mock identity.

Future reads must enforce organization, clinic, identity, and capability scope at the application/data boundary. Patient data must not appear in URLs or browser logs. React escaping remains enabled; unsanitized HTML is forbidden. Future session cookies must be secure, HTTP-only, same-site, expiring, and server validated. Future mutations require CSRF protection, authorization, idempotency, and audit records. No compliance certification is claimed.
