# Backend API Conventions

All product APIs live under `/api/v1`. Unversioned product routes are prohibited.
`/health/live` and `/health/ready` are operational probes, not product APIs.

REST uses JSON, UTC ISO-8601 timestamps, opaque identifiers, cursor pagination,
allowlisted sorting/filtering, bounded page sizes, and explicit clinic scope.
Mutation retries use `Idempotency-Key`; contested aggregates use versions and
`If-Match`. A clinic identifier requests a context but never proves access.

Errors use:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Safe human message.",
    "requestId": "opaque-request-id",
    "retryable": false,
    "fieldErrors": []
  }
}
```

OpenAPI is generated into `backend/openapi/saxlem-api.json`. Future Dart and
TypeScript clients map API DTOs into existing frontend domain models.
