import "server-only";

import { z } from "zod";

const knownEnvironment = z.enum(["development", "qa", "production"]);
export const documentedInvalidSessionSecret =
  "<generate-a-32-byte-base64url-secret>";

function decodeSessionSecret(value: string): Buffer | null {
  if (
    value === documentedInvalidSessionSecret ||
    /^(.)\1+$/u.test(value) ||
    /^(?:placeholder|changeme|replace|secret|password)/iu.test(value)
  ) {
    return null;
  }
  const base64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
  const base64url = /^[A-Za-z0-9_-]+$/u;
  if (!base64.test(value) && !base64url.test(value)) return null;
  try {
    const encoding = base64.test(value) ? "base64" : "base64url";
    const decoded = Buffer.from(value, encoding);
    const canonical = decoded.toString(encoding).replace(/=+$/u, "");
    if (canonical !== value.replace(/=+$/u, "")) return null;
    if (decoded.length > 0 && decoded.every((byte) => byte === decoded[0])) {
      return null;
    }
    const decodedText = decoded.toString("utf8");
    if (/^(?:placeholder|changeme|replace|secret|password)/iu.test(decodedText)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

const sessionSecret = z.string().min(1).refine(
  (value) => (decodeSessionSecret(value)?.byteLength ?? 0) >= 32,
  "SAXLEM_PORTAL_SESSION_SECRET must be valid base64/base64url containing at least 32 bytes.",
);

const rawEnvironmentSchema = z.object({
  SAXLEM_PORTAL_ENV: z.string().optional(),
  SAXLEM_BACKEND_API_URL: z.string().trim().url(),
  SAXLEM_PORTAL_SESSION_SECRET: sessionSecret,
  SAXLEM_PORTAL_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(15_000)
    .default(8_000),
});

export type PortalEnvironmentName = z.infer<typeof knownEnvironment>;

export interface PortalConfiguration {
  readonly environment: PortalEnvironmentName;
  readonly configurationWasExplicit: boolean;
  readonly backendApiUrl: URL;
  readonly sessionSecret: string;
  readonly requestTimeoutMs: number;
}

export class PortalConfigurationError extends Error {
  constructor() {
    super("Clinic Portal configuration is unavailable.");
    this.name = "PortalConfigurationError";
  }
}

export function parsePortalConfiguration(
  source: Readonly<Record<string, string | undefined>>,
): PortalConfiguration {
  const parsed = rawEnvironmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new PortalConfigurationError();
  }

  const explicitEnvironment = knownEnvironment.safeParse(
    parsed.data.SAXLEM_PORTAL_ENV?.trim().toLowerCase(),
  );
  const backendApiUrl = new URL(parsed.data.SAXLEM_BACKEND_API_URL);
  if (
    !["http:", "https:"].includes(backendApiUrl.protocol) ||
    backendApiUrl.username ||
    backendApiUrl.password ||
    backendApiUrl.search ||
    backendApiUrl.hash ||
    backendApiUrl.pathname !== "/"
  ) {
    throw new PortalConfigurationError();
  }
  const effectiveEnvironment = explicitEnvironment.success
    ? explicitEnvironment.data
    : "production";
  if (
    effectiveEnvironment !== "development" &&
    backendApiUrl.protocol !== "https:"
  ) {
    throw new PortalConfigurationError();
  }

  return Object.freeze({
    environment: effectiveEnvironment,
    configurationWasExplicit: explicitEnvironment.success,
    backendApiUrl,
    sessionSecret: parsed.data.SAXLEM_PORTAL_SESSION_SECRET,
    requestTimeoutMs: parsed.data.SAXLEM_PORTAL_REQUEST_TIMEOUT_MS,
  });
}

let cachedConfiguration: PortalConfiguration | undefined;

export function portalConfiguration(): PortalConfiguration {
  cachedConfiguration ??= parsePortalConfiguration(process.env);
  return cachedConfiguration;
}

export function resetPortalConfigurationForTests(): void {
  if (process.env.NODE_ENV === "test") {
    cachedConfiguration = undefined;
  }
}
