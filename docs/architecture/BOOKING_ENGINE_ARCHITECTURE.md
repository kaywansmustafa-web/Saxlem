# Booking Engine Architecture

## Scope

The Booking Engine is an isolated route-scoped vertical slice. It does not modify the canonical Appointment model or persist confirmed appointments.

```text
Mock data source → DTO mapper → repository → use cases → ChangeNotifier controller → immutable state → UI
```

## Domain boundaries

- Doctor and clinic are referenced by canonical IDs through patient-safe booking projections.
- Money is integer IQD.
- Discovery availability is not treated as bookable inventory.
- Clinic-specific availability is loaded after clinic selection.
- Quotes are immutable review snapshots.
- Confirmations are temporary booking-domain values.

## Availability

The mock source models weekly availability, fully booked dates, clinic closures, holidays, and doctor absence. Slots carry an availability version and are revalidated during quote creation and confirmation. Confirmation is idempotent within the route-scoped repository.

## Future replacement

The repository contract can later be backed by server-authoritative schedules, slot holds, idempotent confirmation APIs, appointment persistence, and My Appointments without changing the booking UI contract.
