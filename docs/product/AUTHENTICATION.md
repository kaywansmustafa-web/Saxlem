# Saxlem Authentication

## Purpose

Sprint 8 establishes patient identity through a mobile number and one-time code. It does not collect profile data and does not use passwords.

## Journey

Launch → session restoration → Welcome → Iraqi mobile number → six-digit OTP → patient dashboard.

The Welcome experience introduces Saxlem as a calm healthcare companion: trusted doctor discovery, understandable live queues, and organized care. Authentication is presented as secure verification, not a traditional login form.

## Guest mode

“Continue as Guest” exists for development, QA, demonstrations, and product exploration. A persistent disclosure identifies guest mode. Personalized appointments and similar patient-specific areas are unavailable until the number is verified. Guest mode is not persisted as an authenticated session.

## Mock limitations

The Sprint 8 repository does not send SMS. Its deterministic code is isolated to
explicit Development and opted-in QA composition. Production, missing, and
unknown environment configuration fail closed and report that phone verification
is unavailable until a backend repository is integrated. Server integration must
replace OTP generation, throttling, session issuance, refresh, and revocation
while preserving the domain repository contract.

## Product rules

- Iraq (+964) is the initial country.
- OTP contains six digits and expires after five minutes in the mock.
- Resend is available after 30 seconds.
- Five unsuccessful verification attempts exhaust a challenge.
- Logout removes the secure session and returns to Guest.
- Profile completion is intentionally postponed until backend persistence exists.

## Accessibility

Authentication uses localized strings, directional layout, scroll-safe pages, telephone/OTP autofill hints, semantic labels, minimum design-system touch targets, and a single semantic OTP field that supports paste.
