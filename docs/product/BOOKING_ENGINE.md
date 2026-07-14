# Booking Engine Product Specification

Sprint 5 implements a focused, non-persistent patient booking demonstration:

```text
Doctor Profile → Clinic → Date → Time → Review → Confirm → Success
```

It supports multiple fictional clinics, clinic-specific integer-IQD fees and durations, available slots, fully booked dates, closed clinic days, holidays, and temporary doctor absence. The review presents doctor, clinic, date, time, fee, duration, arrival guidance, and cancellation-policy information.

Confirmation creates only an in-memory mock confirmation. It does not create a core Appointment, update My Appointments, enable Live Queue, cancel, or reschedule appointments.

The success screen provides **View Doctor** and **Return Home** actions. All current clinic schedules and confirmation identifiers are demonstration data.
