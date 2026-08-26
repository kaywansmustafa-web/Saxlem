import "server-only";

import { z } from "zod";

const environmentSchema = z.enum(["development", "qa", "production"]);
export const invalidSecretExample = "<generate-a-32-byte-base64url-secret>";

export interface OwnerConfiguration {
  readonly environment: z.infer<typeof environmentSchema>;
  readonly backendUrl: URL;
  readonly sessionSecret: string;
  readonly timeoutMs: number;
}

function validSecret(value: string): boolean {
  if (value === invalidSecretExample || /^(.)\1+$/u.test(value)) return false;
  if (!/^[A-Za-z0-9_-]+={0,2}$/u.test(value)) return false;
  try {
    return Buffer.from(value.replace(/=+$/u, ""), "base64url").byteLength >= 32;
  } catch {
    return false;
  }
}

export function parseOwnerConfiguration(
  source: Readonly<Record<string, string | undefined>>,
): OwnerConfiguration {
  const environment = environmentSchema.safeParse(
    source.SAXLEM_OWNER_ENV?.trim().toLowerCase(),
  );
  const effectiveEnvironment = environment.success
    ? environment.data
    : "production";
  const parsed = z
    .object({
      SAXLEM_BACKEND_API_URL: z.string().trim().url(),
      SAXLEM_OWNER_SESSION_SECRET: z.string().min(1).refine(validSecret),
      SAXLEM_OWNER_REQUEST_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .min(1_000)
        .max(15_000)
        .default(8_000),
    })
    .safeParse(source);
  if (!parsed.success)
    throw new Error("Owner Portal configuration is unavailable.");
  const backendUrl = new URL(parsed.data.SAXLEM_BACKEND_API_URL);
  if (
    !["http:", "https:"].includes(backendUrl.protocol) ||
    backendUrl.username ||
    backendUrl.password ||
    backendUrl.search ||
    backendUrl.hash ||
    backendUrl.pathname !== "/"
  ) {
    throw new Error("Owner Portal configuration is unavailable.");
  }
  if (
    effectiveEnvironment !== "development" &&
    backendUrl.protocol !== "https:"
  ) {
    throw new Error("Owner Portal configuration is unavailable.");
  }
  if (
    effectiveEnvironment === "development" &&
    backendUrl.protocol === "http:" &&
    !["localhost", "127.0.0.1", "::1"].includes(backendUrl.hostname)
  ) {
    throw new Error("Owner Portal configuration is unavailable.");
  }
  return Object.freeze({
    environment: effectiveEnvironment,
    backendUrl,
    sessionSecret: parsed.data.SAXLEM_OWNER_SESSION_SECRET,
    timeoutMs: parsed.data.SAXLEM_OWNER_REQUEST_TIMEOUT_MS,
  });
}

let cached: OwnerConfiguration | undefined;
export const ownerConfiguration = (): OwnerConfiguration =>
  (cached ??= parseOwnerConfiguration(process.env));
export const resetOwnerConfigurationForTests = (): void => {
  if (process.env.NODE_ENV === "test") cached = undefined;
};
