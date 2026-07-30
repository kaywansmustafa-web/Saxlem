import { loadConfiguration } from './environment';

const required = {
  DATABASE_URL: 'postgresql://example.invalid/saxlem',
  ACCESS_TOKEN_SECRET: 'configuration-access-secret-32-characters',
  REFRESH_TOKEN_SECRET: 'configuration-refresh-secret-32-characters',
  OTP_SECRET: 'configuration-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'configuration-audit-secret-32-characters',
};

describe('backend configuration safety', () => {
  it.each([undefined, '', 'unexpected'])(
    'fails closed to production for %p environment',
    (value) => {
      expect(
        loadConfiguration({ ...required, SAXLEM_BACKEND_ENV: value })
          .environment,
      ).toBe('production');
    },
  );

  it('accepts an explicit supported environment', () => {
    expect(
      loadConfiguration({ ...required, SAXLEM_BACKEND_ENV: 'development' }),
    ).toMatchObject({
      environment: 'development',
      configurationWasExplicit: true,
    });
  });

  it('rejects missing security and database configuration', () => {
    expect(() =>
      loadConfiguration({ SAXLEM_BACKEND_ENV: 'production' }),
    ).toThrow();
    expect(() =>
      loadConfiguration({
        ...required,
        ARRIVAL_LATE_WINDOW_MINUTES: '1441',
      }),
    ).toThrow();
  });

  it('uses documented arrival-window defaults and validates overrides', () => {
    expect(loadConfiguration(required)).toMatchObject({
      arrivalEarlyWindowMinutes: 60,
      arrivalLateWindowMinutes: 120,
      queueRecallGraceMinutes: 5,
      queueHealthBusyThresholdMinutes: 10,
      queueHealthDelayedThresholdMinutes: 25,
      queueFallbackConsultationMinutes: 20,
    });
    expect(
      loadConfiguration({
        ...required,
        ARRIVAL_EARLY_WINDOW_MINUTES: '30',
        ARRIVAL_LATE_WINDOW_MINUTES: '90',
      }),
    ).toMatchObject({
      arrivalEarlyWindowMinutes: 30,
      arrivalLateWindowMinutes: 90,
    });
    expect(() =>
      loadConfiguration({
        ...required,
        ARRIVAL_EARLY_WINDOW_MINUTES: '-1',
      }),
    ).toThrow();
    expect(() =>
      loadConfiguration({
        ...required,
        QUEUE_HEALTH_BUSY_THRESHOLD_MINUTES: '30',
        QUEUE_HEALTH_DELAYED_THRESHOLD_MINUTES: '25',
      }),
    ).toThrow();
  });

  it('uses bounded notification worker and stream defaults', () => {
    expect(loadConfiguration(required)).toMatchObject({
      notificationWorkerEnabled: false,
      notificationWorkerPollIntervalMs: 1000,
      notificationWorkerTickLimit: 20,
      notificationWorkerMaxAttempts: 8,
      notificationWorkerRetryBaseMs: 1000,
      notificationWorkerRetryMaxMs: 300000,
      notificationSsePollIntervalMs: 1000,
      notificationSseHeartbeatIntervalMs: 15000,
      notificationSseMaxConnectionMs: 300000,
      notificationSsePageSize: 50,
      notificationSseMaxReconnectBacklog: 1000,
    });
    expect(() =>
      loadConfiguration({
        ...required,
        NOTIFICATION_WORKER_RETRY_BASE_MS: '2000',
        NOTIFICATION_WORKER_RETRY_MAX_MS: '1000',
      }),
    ).toThrow();
    expect(() =>
      loadConfiguration({
        ...required,
        NOTIFICATION_SSE_HEARTBEAT_INTERVAL_MS: '30000',
        NOTIFICATION_SSE_MAX_CONNECTION_MS: '30000',
      }),
    ).toThrow();
  });
});
