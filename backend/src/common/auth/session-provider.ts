export interface SessionTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpiresAt: Date;
  readonly refreshExpiresAt: Date;
}

export interface SessionProvider {
  create(userId: string, deviceId: string): Promise<SessionTokens>;
  rotate(refreshToken: string): Promise<SessionTokens>;
  revoke(sessionId: string): Promise<void>;
}

export const SESSION_PROVIDER = Symbol('SESSION_PROVIDER');
