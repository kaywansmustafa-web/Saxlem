export interface DatabaseHealth {
  isReady(): Promise<boolean>;
}

export const DATABASE_HEALTH = Symbol('DATABASE_HEALTH');
