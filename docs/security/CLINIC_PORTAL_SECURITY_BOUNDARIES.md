# Clinic Portal Security Boundaries

Sprint 12A has no production identity or backend. The development receptionist session is selected only by server-side composition and is unavailable for missing, unknown, QA, or production configuration. Client presentation cannot choose a repository or enable mock identity.

Future reads must enforce organization, clinic, identity, and capability scope at the application/data boundary. Patient data must not appear in URLs or browser logs. React escaping remains enabled; unsanitized HTML is forbidden. Future session cookies must be secure, HTTP-only, same-site, expiring, and server validated. Future mutations require CSRF protection, authorization, idempotency, and audit records. No compliance certification is claimed.

## Sprint 13K-A authentication boundary

The portal integrates only with backend staff authentication. Patient and
unknown roles are rejected. It validates response and claim structure but does
not possess the backend HS256 secret or claim independent signature
verification.

The server-only portal session uses `jose` JWE with direct key management and
AES-256-GCM. The cookie is encrypted, integrity protected, HttpOnly, SameSite
Strict, high priority, and bounded to 30 days. Production uses the `__Host-`
prefix, Secure, no Domain attribute, and path `/`. Root path is required to
protect every localized route and same-origin authentication handler.

Malformed or expired cookies fail closed. Refresh failure clears the cookie.
Logout clears it even when backend revocation is unavailable. Rotation retains
backend device binding and cannot change user, role, organization, or clinic
context. Tokens never enter response bodies, client props, HTML, URLs, logs,
`localStorage`, or `sessionStorage`.

Mutation handlers require exact same-origin `Origin` and reject cross-site
`Sec-Fetch-Site`. Return paths must be bounded relative paths without control
characters or backslashes. External and protocol-relative redirects fall back
to `/en/dashboard`.

Organization and clinic headers come only from decrypted session state.
Responses are not cached, backend error text is not passed through, and safe
request IDs may be retained for support.

Configuration requires a valid backend URL, a diverse secret of at least 32
characters, and a timeout from 1,000 through 15,000 milliseconds.
Non-development backends require HTTPS.

The backend still lacks an authoritative staff `/me` projection, capability
projection, explicit role/clinic selection, and authoritative tenant display
names. Sprint 13K-A does not simulate them.

## Sprint 13K-C session lifecycle

Access tokens within 30 seconds of expiry are refreshed through the server-only
BFF. Refreshes for the same sealed session are single-flighted, while refresh,
logout, and logout-all mutations for the same backend session are serialized.
This prevents concurrent rotations from replaying one stale refresh token and
ensures a logout queued behind a refresh is the final lifecycle mutation.
Backend revocation remains authoritative when logout wins the serialization
order. Ambiguous, malformed, revoked, context-changing, or expired outcomes fail
closed and clear local authentication.

Refresh responses may not change user, session, role, organization, clinic, or
portal device binding. Token claim structure continues to require the configured
issuer, audience, access-token type, and supported algorithm. A refreshed cookie
is issued only after all contract and context checks pass. Absolute portal
session expiry never extends during refresh.

Controlled HTTP certification covers browser-to-BFF login, backend response
validation, sealed-cookie restoration, refresh rotation, logout,
backend-outage logout, and idempotent logout-all. Error responses are normalized,
`no-store`, and contain neither backend internals nor credentials. Login and
logout mutations are never retried automatically.

Final Sprint 13K certification requires the route matrix, locale and return-path
tests, accessibility checks, production bundle isolation scan, complete Clinic
Portal suite, typecheck, lint, production build, and a separate dependency-risk
review. The existing dependency risk register remains the production release
gate.
