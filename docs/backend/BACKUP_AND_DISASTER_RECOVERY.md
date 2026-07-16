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
