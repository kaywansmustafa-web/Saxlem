# Owner Portal Operations

## Local development

Generate a development-only session encryption secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copy `owner-portal/.env.example` to an untracked `.env.local`, replace the invalid placeholder, and point the backend URL at the local API origin. Then run:

```powershell
cd owner-portal
npm install
npm run dev
```

The sign-in identity must be a real backend `platformAdministrator`. No demo credentials or mock session path exists.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Production requirements

- unique secret of at least 32 decoded bytes stored in the deployment secret manager
- HTTPS Owner Portal and HTTPS backend origins
- secure proxy configuration preserving the public Origin/Host contract
- independent deployment and access monitoring
- dependency advisory review before deployment
- operational error monitoring and availability monitoring

The private local document adapter is intentionally available only in development/test. Production fails closed until an S3-compatible private provider is configured. Before production deployment, add malware scanning, retention and backup policies, provider credentials, and recovery testing. Opaque keys, signature/content-type validation, a 25 MB bound, authorization, and lifecycle auditing are already enforced by the application layer.

Staff/doctor activation credentials are displayed once. Transfer them only through an approved secure channel. Production activation delivery integration is required; never place credentials in URLs, logs, tickets, or persistent documents.

## Incident response

If owner access may be compromised, revoke all sessions through the backend, rotate the Owner Portal session-encryption secret, review immutable backend audit records, and redeploy. Never copy tokens, cookies, passwords, or complete backend responses into support tickets or logs.
