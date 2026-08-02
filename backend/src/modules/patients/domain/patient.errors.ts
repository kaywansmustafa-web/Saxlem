export class PatientAuditPersistenceError extends Error {
  constructor() {
    super('Patient directory audit could not be persisted.');
    this.name = 'PatientAuditPersistenceError';
  }
}
