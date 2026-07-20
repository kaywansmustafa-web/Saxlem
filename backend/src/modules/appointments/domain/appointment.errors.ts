export class AppointmentAuditPersistenceError extends Error {
  constructor() {
    super('Mandatory appointment audit persistence failed.');
    this.name = 'AppointmentAuditPersistenceError';
  }
}
