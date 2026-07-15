# Current Patient Architecture

The feature follows repository → controller → immutable snapshot → presentation.
`PatientProfilesSnapshot.activeProfileId` is the single source of truth; active
flags are derived and never stored independently on each profile.

The application bootstrap owns the profiles controller and passes it into the
patient shell. Widgets observe it but never store a separate selected patient.
Patient-owned Booking drafts, Appointments, Notifications, and Queue snapshots
carry `PatientProfileId`. Their repositories filter or validate by that ID.

The in-memory implementation is replaceable by a backend repository. A future
server must authorize family relationships and every patient-scoped operation;
the client-provided profile ID is never sufficient authorization.
