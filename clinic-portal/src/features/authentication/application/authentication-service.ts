import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  publicSession,
  sessionFromTokenResponse,
  tokenResponseSchema,
  type AuthenticatedSession,
  type PublicPortalSession,
} from "@/features/authentication/domain/auth-models";
import { BackendApiClient } from "@/infrastructure/api/api-client";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { PortalSessionCookie } from "@/infrastructure/auth/session-cookie";
import { sessionLifecycle } from "@/infrastructure/auth/session-lifecycle";

const loginInputSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(256),
    userAgent: z.string().min(1).max(512),
  })
  .strict();

export interface AuthenticationResult {
  readonly sealedSession: string;
  readonly session: PublicPortalSession;
}

export interface RestoreResult extends AuthenticationResult {
  readonly rotated: boolean;
}

export class ClinicPortalAuthenticationService {
  constructor(
    private readonly api: BackendApiClient,
    private readonly cookie: PortalSessionCookie,
    private readonly now: () => number = Date.now,
  ) {}

  async authenticate(
    input: z.input<typeof loginInputSchema>,
  ): Promise<AuthenticationResult> {
    const valid = loginInputSchema.parse(input);
    const deviceId = randomUUID();
    const response = await this.api.request({
      path: "/api/v1/auth/login",
      method: "POST",
      body: {
        email: valid.email,
        password: valid.password,
        deviceId,
        platform: "web",
        userAgent: valid.userAgent,
      },
      schema: tokenResponseSchema,
    });
    const session = sessionFromTokenResponse(
      response.data,
      deviceId,
      valid.userAgent,
      this.now(),
    );
    return this.result(session);
  }

  async restore(
    sealedSession: string | undefined,
  ): Promise<RestoreResult | null> {
    const existing = await this.cookie.unseal(sealedSession);
    if (!existing) return null;
    if (existing.sessionExpiresAt <= this.now()) return null;
    if (existing.accessExpiresAt > this.now() + 30_000) {
      return { ...(await this.result(existing)), rotated: false };
    }
    return sessionLifecycle.singleFlight(sealedSession!, () => sessionLifecycle.run(existing.sessionId, async () => {
      try {
        const response = await this.api.request({
          path: "/api/v1/auth/refresh",
          method: "POST",
          body: {
            refreshToken: existing.refreshToken,
            deviceId: existing.deviceId,
            platform: "web",
            userAgent: existing.deviceUserAgent,
          },
          schema: tokenResponseSchema,
        });
        const refreshed = sessionFromTokenResponse(
          response.data,
          existing.deviceId,
          existing.deviceUserAgent,
          this.now(),
        );
        const rotated = Object.freeze({
          ...refreshed,
          sessionExpiresAt: Math.min(
            refreshed.sessionExpiresAt,
            existing.sessionExpiresAt,
          ),
        });
        this.assertSameIdentityAndContext(existing, rotated);
        return { ...(await this.result(rotated)), rotated: true };
      } catch (error) {
        if (error instanceof PortalApiError || error instanceof Error) {
          throw error;
        }
        throw new Error("Session restoration failed.");
      }
    }));
  }

  async logout(sealedSession: string | undefined): Promise<void> {
    const session = await this.cookie.unseal(sealedSession);
    if (!session) return;
    await sessionLifecycle.run(session.sessionId, () =>
      this.api
        .request({
          path: "/api/v1/auth/logout",
          method: "POST",
          body: { refreshToken: session.refreshToken },
        })
        .then(() => undefined),
    );
  }

  async logoutAll(sealedSession: string | undefined): Promise<void> {
    const session = await this.cookie.unseal(sealedSession);
    if (!session) return;
    await sessionLifecycle.run(session.sessionId, () =>
      this.api
        .request({
          path: "/api/v1/auth/logout-all",
          method: "POST",
          body: { refreshToken: session.refreshToken },
        })
        .then(() => undefined),
    );
  }

  private async result(
    session: AuthenticatedSession,
  ): Promise<AuthenticationResult> {
    return Object.freeze({
      sealedSession: await this.cookie.seal(session),
      session: publicSession(session),
    });
  }

  private assertSameIdentityAndContext(
    previous: AuthenticatedSession,
    next: AuthenticatedSession,
  ): void {
    if (
      previous.userId !== next.userId ||
      previous.role !== next.role ||
      previous.context?.organizationId !== next.context?.organizationId ||
      previous.context?.clinicId !== next.context?.clinicId
    ) {
      throw new Error("Refreshed session context changed unexpectedly.");
    }
  }
}
