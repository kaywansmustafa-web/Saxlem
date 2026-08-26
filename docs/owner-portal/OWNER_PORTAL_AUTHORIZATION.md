# Owner Portal Authorization

## Required identity

Only a globally assigned `platformAdministrator` may establish an Owner Portal session. Patient, receptionist, doctor, and clinic-manager access-token claims are rejected before a cookie is issued. Owner claims must not contain organization or clinic context.

Authorization is layered:

1. Backend endpoints retain their capability and domain authorization.
2. Owner Portal accepts only a `platformAdministrator` claim received directly from the configured backend.
3. Every workspace route is below a server layout that requires a valid sealed session.
4. Every privileged BFF handler restores the same owner session before calling the backend.
5. Navigation reflects available capabilities but is never treated as authorization.

## Session security

- JWE `dir` + `A256GCM`, separate Owner Portal secret
- `__Host-` cookie in production
- HttpOnly, Secure outside development, SameSite Strict, Path `/`
- no browser-accessible access or refresh tokens
- refresh token rotation with identity and session binding
- local cookie clearing on terminal refresh or logout failure
- `redirect: error` on backend requests
- no browser-controlled tenant headers
- same-origin validation on mutations

The portal decodes backend token structure but does not possess or reuse the backend JWT signing secret. It trusts tokens only when received directly from the configured backend over the validated transport.

## Privacy

The portal does not expose password hashes, refresh tokens, secrets, clinical notes, unrestricted patient profiles, or raw audit payloads. Missing global patient, staff, queue, and audit query contracts remain unavailable until privacy-minimized backend APIs are approved.
