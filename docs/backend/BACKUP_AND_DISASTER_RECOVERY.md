# Backup and Disaster Recovery Foundation

Production launch requires automated PostgreSQL backups and point-in-time recovery.
Backups must be encrypted in transit and at rest, stored separately from the
primary database, access-controlled, monitored, and covered by a documented
retention policy.

Restore testing is mandatory: a backup is not trusted until it has been restored
into an isolated environment and integrity checks have passed. Restore exercises
must be scheduled and their results recorded.

Recovery Point Objective and Recovery Time Objective are intentionally not guessed
in Sprint 13A. Product, clinical operations, security, and hosting stakeholders
must define and approve both before production. Those objectives determine backup
frequency, retention, regional strategy, and operational runbooks.

Sprint 13A does not provision backup infrastructure.

## Sprint 13B local rehearsal

`npm run db:backup:rehearse` runs `pg_dump -Fc` inside the development container,
copies the encrypted-at-rest-by-host local artifact into ignored `.backups/`,
restores into `saxlem_restore_rehearsal`, verifies the fictional organization,
and drops the temporary database. The script refuses any other restore name.

This proves mechanics only. It is not production backup infrastructure, does not
establish retention, encryption guarantees, PITR, RPO, or RTO, and must never be
used as the production recovery plan.
