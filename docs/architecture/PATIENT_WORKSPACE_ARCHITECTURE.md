# Patient Workspace Architecture

The feature follows `MockPatientRepository → GetPatients/GetPatientWorkspace → server route → client search/read-only presentation`. Pages and components never import fixtures. Search is a pure application function over server-supplied summaries; workspace loading uses the same repository boundary. Domain models contain no React, CSS, icons, or translated copy.

The existing environment composition remains authoritative. The patient repository is reachable only when the development receptionist session is enabled; production and unknown configuration fail closed. Routes are locale-scoped at `/[locale]/patients` and `/[locale]/patients/[patientId]`.
