# Patient Arrival Workflow

Sprint 12D introduces one explicit state-changing workflow: record that an expected patient arrived. Every entry point opens the same identity confirmation. The only actions are Mark as Arrived, Go Back, and—after success—Prepare for Live Queue. Success makes the appointment queue-ready but does not insert, order, call, or skip any queue entry.

The flow must show patient name and ID, doctor, clinic, appointment time, current state, recorded time, and the next safe step. It contains no check-in, appointment editing, cancellation, rescheduling, or persistence.
