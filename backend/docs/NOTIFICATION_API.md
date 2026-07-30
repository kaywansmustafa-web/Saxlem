# Notification API

All endpoints are under `/api/v1` and require JWT authentication plus an
explicit notification capability.

## Inbox

`GET /api/v1/notifications` returns only the authenticated recipient's records.
Staff and doctor queries additionally use the active organization and clinic
context. Results use ascending delivery sequence, a bounded page size, an
optional unread filter, and a signed session-bound cursor.

## Read state

`POST /api/v1/notifications/:notificationId/read` requires `Idempotency-Key`.
The operation is idempotent, recipient-scoped, and audited without copying the
notification payload. Foreign identifiers return the same not-found response as
missing identifiers.

## Realtime stream

`GET /api/v1/notifications/stream` returns `text/event-stream`. Every
`notification` event uses the decimal delivery sequence as its SSE `id`.
`Last-Event-ID` resumes strictly after an accessible sequence. Events missed
while disconnected are replayed from PostgreSQL.

The stream uses heartbeat comments, bounded pages, a bounded backlog, and a
bounded connection lifetime. Reconnection reauthenticates the session and
membership. If recovery exceeds the stream backlog limit, the client must use
the inbox API. HTTP 413 reports this condition before streaming begins. Socket
backpressure pauses frame production and database polling until drain, close, or
connection expiry. The event is a change signal; clients refresh authoritative
REST queue state.
