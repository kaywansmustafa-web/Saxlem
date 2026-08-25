# ADR-0010: Billing v1 policy and financial invariants

- Status: Accepted
- Date: 2026-08-10
- Activation instant: `2026-08-10T00:00:00.000Z`

## Decision

Billing v1 records organization debt in integer Iraqi dinars. A commission is
earned only when an `initial`, `patientBooked` appointment is completed through
the authoritative queue consultation-completion transaction at or after the
activation instant. The effective organization plan at completion supplies the
amount and immutable rule snapshot. Historical appointment origins remain null
and are never inferred.

The initial persisted plan is `STANDARD_1250` (Standard 1,250 IQD Commission),
worth 1,250 IQD under rule `QUALIFYING_INITIAL_PATIENT_BOOKED_COMPLETION`,
version 1. Existing organizations receive it from the activation instant; new
organizations receive it atomically when created. Effective assignments cannot
overlap.

Commission materialization occurs in the same PostgreSQL transaction as queue
and appointment completion. This is intentionally preferred over the global
outbox publication marker: `OutboxEvent.publishedAt` is shared by consumers and
is not a billing checkpoint. A financial failure therefore rolls back the
clinical completion, audit, outbox, and commission together; an idempotent retry
can safely repeat the command. Database uniqueness permits one earned record per
appointment.

Ledger entries are immutable. A reversal is a separate immutable entry linked
to its original, with one full reversal maximum in v1. No public reversal API is
provided.

Statements are organization-level calendar months in `Asia/Baghdad`. UTC
boundaries are persisted. Draft totals are derived from the ledger; explicit
platform-administrator finalization snapshots lines and clinic breakdowns for a
closed month. Finalized statements and their snapshots are immutable. The
current month cannot be finalized.

Platform administrators have global read, plan assignment, and finalization.
Clinic managers have tenant-scoped read access only. Receptionists, doctors,
and patients have no billing capability.

## Non-qualifying activity

Follow-ups, clinic-created appointments, walk-ins, unknown historical origins,
pre-activation completions, and appointments that are merely scheduled,
confirmed, cancelled, or marked no-show never create commission debt.

## Privacy and exclusions

Billing DTOs contain references and financial facts only. They exclude patient
identity, appointment reason, clinical data, phone number, and date of birth.
Payments, refunds, providers, cards, payouts, settlements, taxes, and webhooks
are outside Billing v1.
