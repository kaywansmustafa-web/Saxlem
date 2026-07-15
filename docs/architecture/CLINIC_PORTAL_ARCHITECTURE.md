# Clinic Portal Architecture

The portal is an independent Next.js App Router application. Feature flow is mock source → repository → application service → server presentation. Pages never import fixtures. Domain values contain no React, CSS, icons, or translated strings. Server Components are the default; client code is limited to shell navigation and locale interaction. Money will remain integer IQD and timestamps will be ISO instants interpreted in the clinic timezone.

The single environment variable `SAXLEM_PORTAL_ENV` enables the mock session only for `development`. Missing, unknown, QA, and production values fail closed.
