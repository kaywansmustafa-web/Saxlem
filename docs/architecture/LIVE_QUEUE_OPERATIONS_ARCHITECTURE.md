# Live Queue Operations Architecture

## Flow

`mock source → repository → application service → immutable result → presentation`

`LiveQueueRepository` owns the versioned queue and operation-id ledger. `OperateQueue` is the only transition entry point. It applies the command, synchronizes the existing appointment repository, and returns a derived immutable snapshot. Pages never own authoritative queue state.

## Lifecycle and transitions

- Queue: `closed → open → paused → open`.
- Patient: `queueReady → called/inConsultation → completed` or `noResponse`.
- Call Next completes the previous current patient and promotes the lowest-numbered eligible patient atomically.
- At most one patient can be called or in consultation.
- Completion and no-response require a current patient.
- Operational actions are rejected while closed or paused.

## Safety

Every command includes the expected queue version and a unique operation ID. A mismatched version is rejected as stale. Repeating a completed operation ID returns its original result without another mutation. Invalid lifecycle transitions fail before a result is published. The API maps stale state to HTTP 409 and business-rule failures to 422.

## Propagation

The composition root holds one process-local queue repository and one appointment repository. Successful queue operations synchronize appointment status, wait, timeline, and queue details. Existing dashboard and patient-workspace loaders derive their views from those shared repositories, so no queue rule is repeated in presentation code.

## Future realtime integration

Replace the mock repository with a durable transactional adapter using the same contract. Persist operation IDs and aggregate versions, publish committed queue events through an outbox, and stream snapshots to subscribed clinic clients. Server-authoritative ordering, authorization, audit retention, reconnect reconciliation, and multi-instance concurrency belong to that backend phase. Doctor controls remain a separately authorized future capability.
