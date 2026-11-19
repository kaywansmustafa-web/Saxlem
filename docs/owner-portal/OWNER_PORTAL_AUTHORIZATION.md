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

Every `/api/v1/platform/*` route requires `platform:administration` and a global platform-administrator principal with no tenant clinic or organization context. Tenant-scoped principals are rejected even if a capability were accidentally assigned.

Staff and doctor accounts are created inactive. A cryptographically random one-time activation credential is returned only in the protected creation response, stored only as a keyed hash, expires after 30 minutes, and is invalidated after use. Password setup uses Argon2 and never records the plaintext credential in logs or audit metadata. Production delivery-provider integration remains required.

The portal does not expose password hashes, refresh tokens, secrets, clinical notes, diagnoses, consultation content, unrestricted patient details, raw audit metadata, or full patient identity in global live operations. Document paths are server-generated and never accepted from browsers.
