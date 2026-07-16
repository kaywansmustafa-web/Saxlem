# Live Queue Operations

Sprint 12E gives receptionists one trustworthy workspace for confirming queue flow. It answers who is current, who is next, what changed, and which action is available without exposing manual ordering controls.

## Supported operations

- Open, pause, and resume the queue.
- Call the next eligible patient.
- Recall the current patient or record no response.
- Complete the current consultation.

Pause and completion require confirmation. Other actions provide immediate, restrained feedback describing the current patient, next patient, and queue health. Manual reorder, insertion, deletion, queue-number editing, doctor reassignment, and arbitrary sorting are excluded.

## Queue health

Health is described with a word, icon, semantic color, and explanation. Healthy means comfortable flow, Busy means elevated waiting load, and Delayed means waits or doctor delay require attention. Color is never the only signal.

## Accessibility and language

The workspace uses semantic headings, definitions, tables, native buttons, a polite live region, visible global focus styles, RTL layout, responsive 44/48-pixel targets, and reduced-motion-compatible global behavior. English and Arabic queue terminology is prepared. Badini queue terminology currently falls back to English except `Rêza zindî` and requires native-language review before release.

## Exclusions

No backend, persistence, realtime synchronization, doctor controls, appointment editing, patient editing, billing, reporting, analytics, or Flutter changes are part of this sprint.
