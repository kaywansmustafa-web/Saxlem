# Production release checklist

## Release safety gate

- [ ] Build explicitly uses `--dart-define=SAXLEM_ENV=production`.
- [ ] `flutter test test/release` passes.
- [ ] Production composition resolves to the production backend repository, or
      the explicit unavailable repository while backend integration is pending.
- [ ] Production composition cannot construct `MockAuthRepository`.
- [ ] Production resources contain no development OTP.
- [ ] No OTP, session credential, or phone number is written to logs.
- [ ] Production authentication never falls back to mock behavior.

## Quality gate

- [ ] `flutter gen-l10n` completes.
- [ ] `dart format --set-exit-if-changed .` completes.
- [ ] `flutter analyze` reports no issues.
- [ ] `flutter test` passes.
- [ ] `git diff --check` is clean.
- [ ] The production-configured APK builds successfully.
- [ ] Core launch and unavailable-auth behavior are smoke-tested on Android.

## Distribution gate

- [ ] Application identifier, display name, version, icon, and splash are final.
- [ ] Production signing is configured outside source control.
- [ ] Privacy, support, rollback, and release ownership are confirmed.

A production build is not an operational authentication release until the real
backend repository, server-side OTP controls, session issuance, and revocation
are implemented and separately approved.

