# Authentication Security

- Staff passwords use explicitly configured Argon2id parameters (64 MiB, three
  iterations, one lane, 32-byte output), policy enforcement, and rehash-on-login.
- Password policy requires at least 12 characters and basic entropy; a breached-
  password checker interface is reserved.
- OTP comparison uses a dedicated HMAC key and timing-safe byte comparison.
- OTP creation, replacement, attempts, and successful consumption are serialized
  with PostgreSQL transactional advisory locks and conditional writes.
- Refresh tokens use cryptographically secure random generation and hash-only storage.
- Authentication events record outcomes without OTPs, passwords, or tokens.
- Development OTP composition throws outside development/test.
- A replaceable in-memory limiter protects OTP request/verify, login, refresh,
  logout, and logout-all. It is process-local; Redis remains required before
  horizontally scaled production deployment.
- JWT verification pins HS256, issuer, audience, expiry, and access-token type.
- The JWT guard resolves the database-backed session, current role version,
  capabilities, active membership, and tenant context on every protected request.
- Authentication audit subjects use purpose-separated keyed hashes.
- Secret configuration requires independent OTP, refresh, access, and audit keys.

## Residual controls

- IP hashes are recorded but are intentionally not a hard session-binding factor;
  mobile networks change addresses frequently. Device ID, platform, and user-agent
  hash are enforced. IP-risk scoring is reserved for a future risk engine.
- The local limiter cannot coordinate multiple backend replicas. Production must
  replace the existing boundary with Redis before scaling beyond one instance.
