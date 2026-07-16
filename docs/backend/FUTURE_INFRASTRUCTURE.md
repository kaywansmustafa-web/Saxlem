# Reserved Future Infrastructure

None of the following is installed or implemented in Sprint 13A.

## Redis

Potential uses: distributed rate limiting, OTP challenge support, session and
revocation caching, and realtime fan-out. PostgreSQL remains authoritative.

## BullMQ

Potential uses: reminders, notification delivery, expired OTP cleanup, queue
cleanup, and scheduled background work. Its adoption depends on Redis approval.

## S3-compatible object storage

Potential uses: clinic logos, doctor profile images, and future documents or
certificates. The database stores metadata and object references, not binary files.

## Observability

Reserve vendor-neutral adapters for Sentry or equivalent error monitoring,
Prometheus-compatible metrics, and Grafana or equivalent dashboards. Current
structured logs and health probes must not depend on any vendor.
