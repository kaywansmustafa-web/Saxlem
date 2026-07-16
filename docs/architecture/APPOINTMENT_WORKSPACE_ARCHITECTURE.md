# Appointment Workspace Architecture

The feature follows `MockAppointmentRepository → application services → locale route → presentation`. Pages never import fixtures. Pure services own search, chronological ordering, and urgency ordering. The development-only composition root supplies list and workspace services and continues to fail closed outside development. Routes are `/[locale]/appointments` and `/[locale]/appointments/[appointmentId]`.
