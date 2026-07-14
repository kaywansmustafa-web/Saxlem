# My Appointments Architecture

## Boundaries

The feature follows the existing feature-first structure. `PatientAppointment` is a view-specific domain entity and does not alter the existing core `Appointment`. `DoctorReference` lives in core models because it is a small reusable cross-feature value object.

## Data flow

`PatientAppointmentsRepository` is the presentation-independent contract. The sprint implementation, `InMemoryPatientAppointmentsRepository`, is the single source of truth for both Booking and My Appointments. It exposes an immutable snapshot and update stream. A backend implementation can replace it through constructor injection without changing routes or widgets.

Booking confirmation is converted at the data boundary by `BookingConfirmationAppointmentMapper`, written to the repository, and only then shown as successful. Navigation carries no appointment payload. My Appointments always reloads and observes the repository.

## State and presentation

`AppointmentsController` owns loading, failure, snapshot, and selected-tab state. Widgets receive immutable entities and callbacks. Counts are derived from the current snapshot. Empty-state copy uses repository history metadata to distinguish first-time and returning patients.

All layout uses directional padding and Flutter local date/time formatting. Controls use Material components for semantics, focus handling, minimum targets, RTL mirroring, and text scaling. Visible copy is centralized by feature boundaries and is ready to move into the app localization system when ARB resources are introduced.

## Deferred work

Persistence, backend synchronization, cancellation, rescheduling, queue enrollment, and actionable Rate Visit / Book Again controls are explicitly deferred. The same-day queue button remains disabled unless a future repository supplies a queue entry identifier.
