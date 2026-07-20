export class ArrivalAuditPersistenceError extends Error {
  constructor() {
    super('Mandatory arrival audit persistence failed.');
    this.name = 'ArrivalAuditPersistenceError';
  }
}
