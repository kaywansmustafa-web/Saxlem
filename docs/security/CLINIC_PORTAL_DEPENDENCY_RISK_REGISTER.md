# Clinic Portal Dependency Risk Register

Status: temporary, time-bounded security exception
Owner: Saxlem engineering
Recorded: 2026-07-31
Expiry: 2026-08-14, or immediately when a compatible upstream release becomes available

This register is not vulnerability suppression. `npm audit` remains non-zero and
must remain unfiltered. The direct Next.js advisories affecting 16.2.10 were
patched by upgrading to 16.2.12. The remaining findings are upstream/transitive
and are unreachable under the certified application behavior described below.

Any introduction of image processing, untrusted CSS, user-controlled glob
patterns, filesystem-path processing, or affected runtime imports invalidates
this exception immediately.

## PostCSS

- Advisories: GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849
- Installed version: 8.4.31
- Patched upstream version: 8.5.18 or later covers all three advisories
- Dependency path: `clinic-portal -> next@16.2.12 -> postcss@8.4.31`
- Classification: production build-time transitive dependency
- Current reachability: only repository-controlled styles are compiled; no API
  accepts CSS or source maps and application code does not import PostCSS.
- Compensating controls: certified source/API scans reject untrusted CSS and
  source-map inputs; dependency reachability is tested before merge.
- Unsupported upgrade reason: current stable Next.js pins PostCSS 8.4.31.
- Prohibited remediation: npm overrides, `--force`, or unsafe downgrade.
- Review: mandatory before Sprint 13V and before any production deployment.

## Sharp

- Advisory: GHSA-f88m-g3jw-g9cj
- Installed version: 0.34.5
- Patched upstream version: 0.35.0 or later
- Dependency path: `clinic-portal -> next@16.2.12 -> sharp@^0.34.5` (optional)
- Classification: production-capable optional runtime/build dependency
- Current reachability: no `next/image`, image optimizer route, or user image
  workflow exists; application code does not import Sharp.
- Compensating controls: architecture scans certify absence of image-processing
  entry points and production imports.
- Unsupported upgrade reason: current stable Next.js does not accept Sharp 0.35.
- Prohibited remediation: npm overrides, `--force`, or unsafe downgrade.
- Review: mandatory before Sprint 13V and before any production deployment.

## ESLint, minimatch, and brace-expansion

- Advisory: GHSA-mh99-v99m-4gvg
- Installed versions: ESLint 9.39.5, minimatch 3.1.5 and 10.2.5,
  brace-expansion 1.1.16 and 5.0.7
- Patched upstream version: brace-expansion 5.0.8 or later under the published
  advisory range, requiring compatible upstream lint dependency chains
- Dependency paths: `eslint -> minimatch -> brace-expansion`, and
  `eslint-config-next -> plugins/typescript-eslint -> minimatch -> brace-expansion`
- Classification: development-only lint and parser tooling
- Current reachability: not imported by application code and absent from
  production runtime dependency declarations.
- Compensating controls: release-safety tests prohibit runtime imports and the
  production bundle is scanned for lint execution and affected package names.
- Unsupported upgrade reason: current compatible lint packages retain affected
  paths; npm proposes breaking or unsafe changes rather than a supported chain.
- Prohibited remediation: npm overrides, `--force`, or unsafe downgrade.
- Review: mandatory before Sprint 13V and before any production deployment.

## Gates

### Sprint development gate

Development may proceed only while direct exploitable framework advisories are
patched, reachability controls pass, and no Critical, High, or Medium application
implementation defect exists.

### Production release gate

The unresolved dependency advisories require renewed security review and explicit
risk acceptance or upstream remediation. No silent production release is allowed.

## Recheck condition

Reassess immediately when a stable Next.js release depends on PostCSS 8.5.18+
and supports Sharp 0.35.0+, or when compatible ESLint/Next lint releases remove
all dependency paths covered by GHSA-mh99-v99m-4gvg. In all cases reassess no
later than 2026-08-14, before Sprint 13V, and before production deployment.
