# Clinic Portal Architecture

The portal is an independent Next.js App Router application. Feature flow is mock source → repository → application service → server presentation. Pages never import fixtures. Domain values contain no React, CSS, icons, or translated strings. Server Components are the default; client code is limited to shell navigation and locale interaction. Money will remain integer IQD and timestamps will be ISO instants interpreted in the clinic timezone.

The single environment variable `SAXLEM_PORTAL_ENV` enables the mock session only for `development`. Missing, unknown, QA, and production values fail closed.

## Sprint 13K-A authentication boundary

Authentication now uses a server-side backend-for-frontend boundary. Same-origin
route handlers delegate to a server-only application service and validated API
client. Zod validates backend token responses and claim structure. Patient and
unknown roles are rejected.

The portal trusts access tokens only because they are received directly from the
configured backend. It does not independently verify the backend HS256 signature
and never receives the backend signing secret. `jose` encrypts and
integrity-protects the resulting session in an HttpOnly cookie. Tokens are never
passed to Client Components.

The server-only application flow is:

`Route Handler -> Authentication Service -> Backend API Client -> Backend`

The API client permits only `/api/v1/*` paths, applies a bounded timeout,
disables caching, validates JSON, normalizes backend error envelopes, preserves
request IDs, handles invalid JSON and `204`, and derives bearer and tenant
headers only from sealed session state.

Missing or unknown environment names normalize to production-safe behavior.
QA, production, and production-safe fallback configurations require an HTTPS
backend. Development alone may use local HTTP.

## Deferred backend contracts

Sprint 13K-A does not invent data the backend does not expose. The following
remain deferred:

- an authoritative staff `/me` projection;
- an authoritative capability projection;
- explicit role and clinic selection;
- authoritative organization and clinic display names.

Tenant IDs are security context only. Backend authorization remains
authoritative.
