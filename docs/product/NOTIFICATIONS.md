# Patient Notifications

Sprint 10 replaces the Alerts placeholder with a calm in-app communication
center. It explains what happened, why it happened when known, and what the
patient should do next.

The feature is mock-driven. It does not include Firebase, operating-system push
notifications, local notifications, permissions, or receptionist workflows.

Patients can open a notification, mark it read by opening it, and delete an
individual noncritical notification. Clear All is postponed until the permanent
`SaxlemDialog` exists. Queue events for one queue session form a conversation;
all other categories remain individual records.

Priority is internal. Patients see calm wording, iconography, ordering, and
appropriate visual emphasis rather than engineering labels such as Critical or
High. Critical records cannot be deleted. `appointmentCheckedIn` is reserved in
the domain for future clinic workflows but is not produced by Sprint 10.

