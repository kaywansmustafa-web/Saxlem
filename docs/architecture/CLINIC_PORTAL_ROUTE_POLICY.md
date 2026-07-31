# Clinic Portal Route Policy

Sprint 13K-B centralizes portal access in the typed route-policy registry. Every
operational route family is wrapped by a Server Component boundary that reads
only the sealed HttpOnly session. Browser input never supplies organization or
clinic context.

## Authentication flow

Localized login is available at `/en/login`, `/ar/login`, and `/ku/login`.
Successful login stores tokens only inside the sealed server cookie. Protected
layouts validate the cookie and role before rendering. When an access token is
near expiry, navigation passes through `/api/auth/continue`; that same-origin BFF
handler rotates tokens, updates the HttpOnly cookie, and returns to a validated
local path. Failure clears the cookie and opens the localized session-expired
state.

## Role boundaries

- Receptionist: dashboard, patients, appointments, live queue, doctors,
  schedule, notifications, settings.
- Doctor: workspace, today's patients, schedule, notifications, settings.
- Clinic manager: conservative clinic presentation routes plus clinic
  management; no capability claims are inferred.
- Platform administrator: administration, organizations, clinics, settings;
  clinic-operation routes are denied.

Backend authorization remains authoritative. The portal policy is a defensive
presentation and routing boundary, not an authoritative capability source.

## Placeholder ownership

Production routes owned by later sprints render an honest unavailable state and
the owning sprint. They expose no mock clinical records or mutation controls.
Reception workflows belong to 13L/13M, doctor workflows to 13N, clinic onboarding
to 13S, and remaining foundation settings to 13K-C.

## Known backend limitations

The backend does not yet provide an authoritative staff `me` projection,
capability projection, role/clinic selector, or authoritative display names for
organizations and clinics. The shell therefore shows only the role and shortened
sealed-context identifiers. It never fabricates names.

## Sprint 13K-C certification policy

Every registry entry is certified against unauthenticated access and all four
supported staff roles. Direct URL authorization, navigation visibility,
localized landing routes, placeholder ownership, and shell ownership must agree
with the registry. Patient and unknown roles are rejected before shell rendering.

Return paths are relative, limited to 512 characters, and restricted to a
registered route authorized for the authenticated role. Absolute,
protocol-relative, API, backslash, control-character, malformed, and cross-role
targets fall back to that role's localized landing route. Locale switching keeps
the equivalent registered route and never changes authorization.

Sprint 13K production routes remain non-operational placeholders until their
named owning sprint replaces them. A placeholder may explain availability but
must not expose mock records, fabricated tenant names, or clinical mutations.
