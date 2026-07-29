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
