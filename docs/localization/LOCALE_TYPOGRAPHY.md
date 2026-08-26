# Locale Typography

Saxlem selects its product font from the active locale, independently of text direction.

| Locale | Portal identifier | Flutter identifier | Font |
|---|---|---|---|
| English | `en` | `en` | Existing/default Noto Sans behavior |
| Arabic | `ar` | `ar`, `ar_IQ` | Cairo |
| Badini Kurdish | `ku` | `ku`, `ku_IQ` | Rudaw |

## Cairo

- Source: official Google Fonts repository (`google/fonts`, `ofl/cairo`).
- Upstream typeface: Cairo by Mohamed Gaber.
- Identifiable bundled version: 3.130.
- Asset: `Cairo-Variable.ttf`.
- Supported weight axis: 200–900; Saxlem uses the existing 400, 500, 600, and 700 typography roles.
- License: SIL Open Font License 1.1. A copy is stored alongside each bundled application asset as `Cairo-OFL.txt`.
- Cairo is self-hosted; production rendering makes no runtime font-network request.

## Rudaw

- Source: product-owner-supplied asset.
- Original implementation source: `C:\Users\Ster\Desktop\Fonts\Rudaw-Regular.ttf`.
- Portal asset: `clinic-portal/public/fonts/Rudaw-Regular.ttf`.
- Flutter asset: `mobile/assets/fonts/Rudaw-Regular.ttf`.
- Registered weight: Regular / 400 only.
- No additional Rudaw weights are claimed or bundled. When existing UI styles request a heavier weight, the browser or Flutter renderer may synthesize it from Regular. Native visual review remains required before production deployment.

## Architecture

- Clinic Portal applies locale typography once at the locale layout root using the `lang` attribute. RTL is not used as a font selector.
- Flutter derives `ThemeData` from the selected locale and applies the family through the global theme and text theme.
- English retains the prior font behavior.
- Runtime configuration contains no absolute developer font paths.
- Approved localization values, placeholders, ICU messages, directionality, and product behavior are unaffected by this policy.
