# Saxlem Owner Portal Architecture

## Purpose

`owner-portal/` is an independent English-only Next.js application for globally assigned Saxlem platform administrators. It does not import Clinic Portal runtime code and it does not place owner routes inside the clinic application.

## Boundaries

The backend remains authoritative. The browser communicates only with same-origin Owner Portal handlers. Backend access and refresh tokens remain in an encrypted HttpOnly cookie and are used only by server modules. Pages obtain data through validated adapters over `/api/v1`.

```text
Browser -> Owner Portal route/server component -> sealed owner session
        -> server-only API client -> Saxlem backend -> PostgreSQL
```

The application uses Next.js 16, React 19, strict TypeScript, Zod, JOSE, Vitest, Testing Library, and jest-axe. There is no runtime dependency on `clinic-portal/`.

## Routes

- `/login`: owner sign-in
- `/dashboard`: executive snapshot using bounded authoritative reads
- `/organizations`, `/organizations/new`
- `/clinics`, `/clinics/new`
- `/doctors`
- `/appointments`
- `/plans`
- `/platform-health`
- `/staff`, `/patients`, `/live-operations`, `/billing`, `/commissions`, `/statements`, `/analytics`, `/documents`, `/audit-log`, `/settings`: honest capability states pending missing backend contracts

## Data policy

Bounded pages are never presented as global totals. The dashboard labels bounded organization, clinic, and appointment values as loaded records; only the doctor endpoint's authoritative `total` is presented as a total. Unsupported analytics are not calculated from partial pages.

## Deployment

Production requires HTTPS, a strong unique base64url session-encryption secret, and an HTTPS backend origin. Deploy the application independently from Clinic Portal. Security headers are emitted by Next.js configuration. A reverse proxy must preserve the public request origin used by same-origin mutation checks.
