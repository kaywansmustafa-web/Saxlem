# Authentication Architecture

## Boundary

Authentication follows Saxlem's feature-first flow:

`AuthRepository → domain operations → AuthController → immutable AuthState → presentation`

Widgets never access persistence. `SessionStorage` isolates secure platform storage, while `AuthRepository` isolates the temporary mock service and future backend.

## Session states

- `initializing`: restoration is unresolved.
- `guest`: no usable credential exists or logout occurred.
- `authenticated`: a valid stored session exists.
- `sessionExpired`: a stored session existed but its expiry passed.

Logout is an event, not a persisted session status. It clears storage and transitions to Guest.

## Bootstrap

`AppController` resolves locale first and then restores authentication. A missing locale opens language selection. Guest and expired sessions open authentication. Authenticated sessions open the existing five-tab `HomePage`. Explicit guest continuation opens the same shell with a visible restriction banner and unavailable personalized appointments.

## Persistence and security

`SecureSessionStorage` uses platform-protected storage. The mock stores only an opaque user ID, verified phone reference, and expiry. OTP values and challenges are never persisted. SharedPreferences remains exclusive to non-secret locale preferences.

The backend implementation must add opaque access/refresh credentials, rotation, revocation, reuse detection, server-authoritative retry limits, generic anti-enumeration responses, device-session management, and audited redaction. Access tokens should remain in memory where practical; refresh credentials belong in secure storage.

The mock code and deterministic patient identity are development-only. Production composition must fail closed if no backend repository is configured.

## Extension points

- Replace `MockAuthRepository` without changing controllers or pages.
- Replace initial Iraqi parsing with country-specific parsing metadata.
- Add a country data source without changing `PhoneNumber`.
- Add biometrics only as local credential unlocking, never as a replacement for server validation.
- Add profile completion after backend integration as a separate feature and route gate.

## Testing contract

Tests cover E.164 normalization, invalid numbers, guest disclosure, OTP completion, locale/auth bootstrap combinations, session restoration, expiration, logout, RTL, 200% text scaling, semantics, and secure-storage boundaries.
