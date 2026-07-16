import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(true),
    });
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports readiness only after checking the database', async () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(true),
    });
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      checks: ['database'],
    });
  });

  it('rejects readiness when PostgreSQL is unavailable', async () => {
    const controller = new HealthController({
      isReady: () => Promise.resolve(false),
    });
    await expect(controller.ready()).rejects.toThrow('Database is not ready.');
  });
});
