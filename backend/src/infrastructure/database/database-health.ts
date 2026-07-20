export interface DatabaseHealth {
  isReady(): Promise<boolean>;
  invalidClinicTimezones?(): Promise<readonly string[]>;
}

export const DATABASE_HEALTH = Symbol('DATABASE_HEALTH');
