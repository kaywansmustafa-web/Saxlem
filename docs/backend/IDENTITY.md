# Backend Identity

Saxlem identities are users with scoped role assignments: patient, receptionist,
doctor, clinic manager, or platform administrator. Patient identity uses Iraqi
mobile OTP only. Staff identity uses email and Argon2id passwords. Passkeys, SSO,
and magic links have provider contracts only and are not implemented.

Controllers expose only `/api/v1/auth/*`; domain workflows use Prisma persistence
through the Identity module. Role and capability resolution remain separate from
future business authorization.
