import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(true),
      invalidClinicTimezones: () => Promise.resolve([]),
    });
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports readiness only after checking the database', async () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(true),
    });
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      checks: ['database', 'clinic-timezones'],
    });
  });

  it('fails readiness when a persisted clinic timezone is not supported by ICU', async () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(true),
      invalidClinicTimezones: () => Promise.resolve(['Invalid/Zone']),
    });
    await expect(controller.ready()).rejects.toThrow(
      'Clinic timezone configuration is incompatible with this runtime.',
    );
  });

  it('rejects readiness when PostgreSQL is unavailable', async () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(false),
    });
    await expect(controller.ready()).rejects.toThrow('Database is not ready.');
  });
});
