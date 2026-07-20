# Session Security

Access tokens are ten-minute HS256 JWTs with issuer, audience, subject, session ID,
token ID, authentication time, authorization version, role version, role, tenant,
and access-token type. The JWT guard pins all cryptographic and semantic claims.
Refresh tokens are 48-byte opaque random values and only SHA-256 hashes are stored.
Sessions bind device ID, platform, and a keyed user-agent hash; IP is retained as a
keyed signal with documented mobile-network tolerance.

Refresh rotates every time. Reuse of a revoked/replaced token revokes the entire
family. Families have an absolute 90-day lifetime, while individual tokens retain
the shorter rolling lifetime. Logout revokes one session; logout-all revokes every
active family and session for that user. Flutter should eventually store refresh tokens only through
secure storage; web should use secure HttpOnly cookies in its integration sprint.
