import "server-only";

// Request bodies for the backend's staff authentication endpoints. Kept as pure
// functions so tests can check them against the backend's OpenAPI contract.
export function loginRequestBody(input: {
  email: string;
  password: string;
  deviceId: string;
  userAgent: string;
}) {
  return {
    email: input.email,
    password: input.password,
    deviceId: input.deviceId,
    platform: "web" as const,
    userAgent: input.userAgent.slice(0, 512),
  };
}

export function refreshRequestBody(input: {
  refreshToken: string;
  deviceId: string;
  userAgent: string;
}) {
  return {
    refreshToken: input.refreshToken,
    deviceId: input.deviceId,
    platform: "web" as const,
    userAgent: input.userAgent.slice(0, 512),
  };
}
