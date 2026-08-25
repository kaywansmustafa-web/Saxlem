# Sprint 13U String Inventory

Reconciled against repository catalogs and presentation sources on 2026-08-26. One row represents one normalized English source from the locked baseline; runtime data compositions are not counted as hardcoded English copy.

## Final coverage

- Total unique inventory rows: 1227
- COMPLETE: 969
- MACHINE_CONTRACT: 157
- RESOLVED: 3
- RUNTIME_DATA_COMPOSITION: 25
- BRAND_NAME: 1
- USER_VISIBLE: 72

- Confirmed unresolved hardcoded/catalog strings: 0
- Portal Arabic/Badini dictionaries are explicit and do not spread English.
- Flutter ARB catalogs have complete key parity.
- Backend candidates are classified in `backend-string-classification.md`.
- Linguistic residuals requiring native proofing are recorded in `native-review-residuals.md`.

## Method

- Catalog entries are complete only when both supported translations are present and differ from English.
- Dynamic values such as names, identifiers, dates, and interpolated localized labels are classified as runtime data composition.
- Backend messages remain English when classified as machine contracts or internal boundaries; frontend stable-code/state mappings own presentation localization.
- Coverage is structural and does not replace native-language proofreading.
