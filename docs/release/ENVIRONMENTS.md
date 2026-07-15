# Saxlem application environments

Saxlem uses one Flutter entry point and compile-time configuration. Missing or
unknown configuration is treated as production so the application fails closed.

| Environment | Command | Mock authentication |
|---|---|---|
| Development | `flutter run --dart-define=SAXLEM_ENV=development` | Enabled |
| QA | `flutter run --dart-define=SAXLEM_ENV=qa` | Disabled by default |
| QA with mock | Add `--dart-define=SAXLEM_ALLOW_MOCK_AUTH=true` | Explicitly enabled |
| Production | `--dart-define=SAXLEM_ENV=production` | Always disabled |

`SAXLEM_ALLOW_MOCK_AUTH=true` is ignored in production and for unknown values.
Until a backend repository is integrated, production authentication reports that
phone verification is unavailable. It never falls back to local authentication.

The environment is compile-time configuration and cannot be changed from the UI.
Native build flavors and additional entry points are intentionally not used.

