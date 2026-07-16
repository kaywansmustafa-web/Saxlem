import { z } from 'zod';

const environmentSchema = z.enum(['development', 'test', 'qa', 'production']);
const truthy = z.enum(['true', 'false']).transform((value) => value === 'true');

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
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
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
      accessTokenSecret: input.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: input.REFRESH_TOKEN_SECRET,
      configurationWasExplicit: parsedEnvironment.success,
    };
  });

export type BackendConfiguration = z.infer<typeof configurationSchema>;

export function loadConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): BackendConfiguration {
  return configurationSchema.parse(environment);
}
