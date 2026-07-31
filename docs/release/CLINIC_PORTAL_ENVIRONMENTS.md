# Clinic Portal Environments

Sprint 13K-A uses a single Next.js entry point and server-only environment
configuration.

## Required variables

| Variable | Requirement |
| --- | --- |
| `SAXLEM_PORTAL_ENV` | `development`, `qa`, or `production`; missing and unknown values normalize to production |
| `SAXLEM_BACKEND_API_URL` | Absolute HTTP(S) URL; HTTPS is mandatory outside explicit development |
| `SAXLEM_PORTAL_SESSION_SECRET` | Unique high-entropy value with at least 32 characters and sufficient diversity |
| `SAXLEM_PORTAL_REQUEST_TIMEOUT_MS` | Integer from 1,000 through 15,000; defaults to 8,000 |

Configuration fails closed. A missing backend URL, weak or missing session
secret, malformed URL, unsafe non-development HTTP URL, or out-of-range timeout
prevents authentication composition.

Do not prefix secrets with `NEXT_PUBLIC_` and do not commit real values.
Development, QA, and production require independent session secrets.

## Local development

```powershell
$env:SAXLEM_PORTAL_ENV="development"
$env:SAXLEM_BACKEND_API_URL="http://localhost:3000"
$env:SAXLEM_PORTAL_SESSION_SECRET="<unique local secret>"
$env:SAXLEM_PORTAL_REQUEST_TIMEOUT_MS="8000"
npm run dev
```

The backend must expose `/api/v1/auth/*`. Development configuration does not
enable a mock session in the production authentication composition.

## QA and production

- Use HTTPS for the backend URL.
- Inject secrets through the deployment secret manager.
- Keep the portal secret separate from all backend JWT, refresh, OTP, audit,
  and database secrets.
- Changing the portal secret invalidates existing portal cookies.
- Reverse proxies must preserve the public origin used by same-origin checks.

## Deferred backend dependencies

The authentication API does not yet provide:

- an authoritative staff `/me` projection;
- an authoritative capability projection;
- explicit role/clinic selection;
- organization or clinic display names.

The portal must not infer or fabricate those values.
