import { z } from 'zod';

const environmentSchema = z.enum(['development', 'test', 'qa', 'production']);
const truthy = z.enum(['true', 'false']).transform((value) => value === 'true');
const cryptographicSecret = z
  .string()
  .min(32)
  .refine((value) => new Set(value).size >= 8, 'Secret lacks diversity.');

const configurationSchema = z
  .object({
    SAXLEM_BACKEND_ENV: z.string().optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    CORS_ORIGINS: z.string().default(''),
    OPENAPI_ENABLED: truthy.default(false),
    APPOINTMENT_PAST_TOLERANCE_MINUTES: z.coerce
      .number()
      .int()
      .min(0)
      .max(60)
      .default(2),
    APPOINTMENT_FOUNDATION_FEE_IQD: z.coerce
      .number()
      .int()
      .min(1)
      .default(25000),
    ARRIVAL_EARLY_WINDOW_MINUTES: z.coerce
      .number()
      .int()
      .min(0)
      .max(1440)
      .default(60),
    ARRIVAL_LATE_WINDOW_MINUTES: z.coerce
      .number()
      .int()
      .min(0)
      .max(1440)
      .default(120),
    QUEUE_RECALL_GRACE_MINUTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(1440)
      .default(5),
    QUEUE_HEALTH_BUSY_THRESHOLD_MINUTES: z.coerce
      .number()
      .int()
      .min(0)
      .max(1440)
      .default(10),
    QUEUE_HEALTH_DELAYED_THRESHOLD_MINUTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(1440)
      .default(25),
    QUEUE_FALLBACK_CONSULTATION_MINUTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(480)
      .default(20),
    NOTIFICATION_WORKER_ENABLED: truthy.default(false),
    NOTIFICATION_WORKER_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(60000)
      .default(1000),
    NOTIFICATION_WORKER_TICK_LIMIT: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
    NOTIFICATION_WORKER_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(8),
    NOTIFICATION_WORKER_RETRY_BASE_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(60000)
      .default(1000),
    NOTIFICATION_WORKER_RETRY_MAX_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(3600000)
      .default(300000),
    NOTIFICATION_SSE_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(250)
      .max(30000)
      .default(1000),
    NOTIFICATION_SSE_HEARTBEAT_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(5000)
      .max(60000)
      .default(15000),
    NOTIFICATION_SSE_MAX_CONNECTION_MS: z.coerce
      .number()
      .int()
      .min(30000)
      .max(900000)
      .default(300000),
    NOTIFICATION_SSE_PAGE_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50),
    NOTIFICATION_SSE_MAX_RECONNECT_BACKLOG: z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1000),
    ACCESS_TOKEN_SECRET: cryptographicSecret,
    REFRESH_TOKEN_SECRET: cryptographicSecret,
    OTP_SECRET: cryptographicSecret,
    AUDIT_HASH_SECRET: cryptographicSecret,
  })
  .superRefine((input, context) => {
    const secrets = [
      input.ACCESS_TOKEN_SECRET,
      input.REFRESH_TOKEN_SECRET,
      input.OTP_SECRET,
      input.AUDIT_HASH_SECRET,
    ];
    if (new Set(secrets).size !== secrets.length)
      context.addIssue({
        code: 'custom',
        message: 'Cryptographic secrets must be independent.',
      });
    if (
      input.QUEUE_HEALTH_DELAYED_THRESHOLD_MINUTES <=
      input.QUEUE_HEALTH_BUSY_THRESHOLD_MINUTES
    )
      context.addIssue({
        code: 'custom',
        message: 'Queue delayed threshold must exceed the busy threshold.',
      });
    if (
      input.NOTIFICATION_WORKER_RETRY_BASE_MS >
      input.NOTIFICATION_WORKER_RETRY_MAX_MS
    )
      context.addIssue({
        code: 'custom',
        message: 'Notification retry base must not exceed its maximum.',
      });
    if (
      input.NOTIFICATION_SSE_HEARTBEAT_INTERVAL_MS >=
      input.NOTIFICATION_SSE_MAX_CONNECTION_MS
    )
      context.addIssue({
        code: 'custom',
        message:
          'Notification heartbeat must be shorter than the connection lifetime.',
      });
  })
  .transform((input) => {
    const parsedEnvironment = environmentSchema.safeParse(
      input.SAXLEM_BACKEND_ENV?.trim().toLowerCase(),
    );
    return {
      environment: parsedEnvironment.success
        ? parsedEnvironment.data
        : ('production' as const),
      port: input.PORT,
      databaseUrl: input.DATABASE_URL,
      logLevel: input.LOG_LEVEL,
      corsOrigins: input.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      openApiEnabled: input.OPENAPI_ENABLED,
      appointmentPastToleranceMinutes: input.APPOINTMENT_PAST_TOLERANCE_MINUTES,
      appointmentFoundationFeeIqd: input.APPOINTMENT_FOUNDATION_FEE_IQD,
      arrivalEarlyWindowMinutes: input.ARRIVAL_EARLY_WINDOW_MINUTES,
      arrivalLateWindowMinutes: input.ARRIVAL_LATE_WINDOW_MINUTES,
      queueRecallGraceMinutes: input.QUEUE_RECALL_GRACE_MINUTES,
      queueHealthBusyThresholdMinutes:
        input.QUEUE_HEALTH_BUSY_THRESHOLD_MINUTES,
      queueHealthDelayedThresholdMinutes:
        input.QUEUE_HEALTH_DELAYED_THRESHOLD_MINUTES,
      queueFallbackConsultationMinutes:
        input.QUEUE_FALLBACK_CONSULTATION_MINUTES,
      notificationWorkerEnabled: input.NOTIFICATION_WORKER_ENABLED,
      notificationWorkerPollIntervalMs:
        input.NOTIFICATION_WORKER_POLL_INTERVAL_MS,
      notificationWorkerTickLimit: input.NOTIFICATION_WORKER_TICK_LIMIT,
      notificationWorkerMaxAttempts: input.NOTIFICATION_WORKER_MAX_ATTEMPTS,
      notificationWorkerRetryBaseMs: input.NOTIFICATION_WORKER_RETRY_BASE_MS,
      notificationWorkerRetryMaxMs: input.NOTIFICATION_WORKER_RETRY_MAX_MS,
      notificationSsePollIntervalMs: input.NOTIFICATION_SSE_POLL_INTERVAL_MS,
      notificationSseHeartbeatIntervalMs:
        input.NOTIFICATION_SSE_HEARTBEAT_INTERVAL_MS,
      notificationSseMaxConnectionMs: input.NOTIFICATION_SSE_MAX_CONNECTION_MS,
      notificationSsePageSize: input.NOTIFICATION_SSE_PAGE_SIZE,
      notificationSseMaxReconnectBacklog:
        input.NOTIFICATION_SSE_MAX_RECONNECT_BACKLOG,
      accessTokenSecret: input.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: input.REFRESH_TOKEN_SECRET,
      otpSecret: input.OTP_SECRET,
      auditHashSecret: input.AUDIT_HASH_SECRET,
      configurationWasExplicit: parsedEnvironment.success,
    };
  });

export type BackendConfiguration = z.infer<typeof configurationSchema>;

export function loadConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): BackendConfiguration {
  return configurationSchema.parse(environment);
}
