# Authentication release safety

`MockAuthRepository` is a development and explicitly opted-in QA tool. The
production composition returns `UnavailableAuthRepository` until a backend
implementation replaces it.

Release invariants:

- Production, missing, and unknown environments cannot enable mock auth.
- The deterministic development OTP is owned only by the mock repository.
- Production localization resources contain neither the OTP nor a fixed example.
- Widgets receive an `AuthRepository`; they do not choose an environment.
- Production authentication fails closed with a clear unavailable message.

The tests in `mobile/test/release/` enforce these invariants. They must run in CI
for every release candidate.

