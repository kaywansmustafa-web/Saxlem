# Patient Arrival Workflow Architecture

State ownership remains in the shared `AppointmentRepository`. Allowed transitions are `expected → arrived → queueReady`; Sprint 12D performs them atomically as one arrival command. Every command includes appointment ID, patient ID, expected version, and an injected UTC clock value. Wrong identity, stale version, invalid ID, and ineligible state are rejected.

The command is idempotent: repeating a successful request returns the existing result and cannot duplicate the arrival timeline event. Read projections for appointment lists/workspaces, patient views, and dashboard metrics derive from the same repository. Clinic-local display formatting occurs only in presentation. Future queue handoff may consume queue-ready state, but this sprint performs no queue mutation.
