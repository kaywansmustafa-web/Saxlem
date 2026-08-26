import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ownerSessionFromTokens,
  tokenResponseSchema,
  type OwnerSession,
} from "@/domain/session";
import { OwnerApiClient } from "./api-client";
import { ownerConfiguration } from "./config";
import {
  cookieName,
  cookieOptions,
  OwnerSessionCookie,
} from "./session-cookie";

const composition = () => {
  const configuration = ownerConfiguration();
  return {
    configuration,
    client: new OwnerApiClient(configuration),
    cookie: new OwnerSessionCookie(configuration),
  };
};

export async function authenticateOwner(
  email: string,
  password: string,
  userAgent: string,
): Promise<string> {
  const { configuration, client, cookie } = composition();
  const deviceId = randomUUID();
  const tokens = await client.request({
    path: "/api/v1/auth/login",
    method: "POST",
    body: {
      email,
      password,
      device: {
        id: deviceId,
        name: "Saxlem Owner Portal",
        platform: "web",
        userAgent,
      },
    },
    schema: tokenResponseSchema,
  });
  const session = ownerSessionFromTokens(tokens, deviceId, userAgent);
  const sealed = await cookie.seal(session);
  (await cookies()).set(
    cookieName(configuration.environment),
    sealed,
    cookieOptions(configuration.environment),
  );
  return "/dashboard";
}

async function readSession(): Promise<OwnerSession | null> {
  const { configuration, cookie } = composition();
  return cookie.unseal(
    (await cookies()).get(cookieName(configuration.environment))?.value,
  );
}

export async function restoreOwnerSession(): Promise<OwnerSession | null> {
  const session = await readSession();
  if (!session) return null;
  if (session.accessExpiresAt > Date.now() + 30_000) return session;
  const { configuration, client, cookie } = composition();
  try {
    const tokens = await client.request({
      path: "/api/v1/auth/refresh",
      method: "POST",
      body: {
        refreshToken: session.refreshToken,
        device: {
          id: session.deviceId,
          name: "Saxlem Owner Portal",
          platform: "web",
          userAgent: session.userAgent,
        },
      },
      schema: tokenResponseSchema,
    });
    const responseSession = ownerSessionFromTokens(
      tokens,
      session.deviceId,
      session.userAgent,
    );
    if (
      responseSession.userId !== session.userId ||
      responseSession.sessionId !== session.sessionId
    )
      throw new Error();
    const refreshed = Object.freeze({
      ...responseSession,
      sessionExpiresAt: session.sessionExpiresAt,
    });
    (await cookies()).set(
      cookieName(configuration.environment),
      await cookie.seal(refreshed),
      cookieOptions(configuration.environment),
    );
    return refreshed;
  } catch {
    (await cookies()).set(
      cookieName(configuration.environment),
      "",
      cookieOptions(configuration.environment, 0),
    );
    return null;
  }
}

export async function requireOwnerSession(): Promise<OwnerSession> {
  const session = await restoreOwnerSession();
  if (!session) redirect("/login?expired=1");
  return session;
}

export async function logoutOwner(all: boolean): Promise<void> {
  const session = await readSession();
  const { configuration, client } = composition();
  try {
    if (session)
      await client.request({
        path: all ? "/api/v1/auth/logout-all" : "/api/v1/auth/logout",
        method: "POST",
        session,
        body: all ? {} : { refreshToken: session.refreshToken },
      });
  } finally {
    (await cookies()).set(
      cookieName(configuration.environment),
      "",
      cookieOptions(configuration.environment, 0),
    );
  }
}

export const ownerApi = (): OwnerApiClient =>
  new OwnerApiClient(ownerConfiguration());
