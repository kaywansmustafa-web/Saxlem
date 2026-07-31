import "server-only";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
export const accessTokenNeedsRefresh = (session: AuthenticatedSession, now = Date.now()): boolean => session.accessExpiresAt <= now + 30_000;
