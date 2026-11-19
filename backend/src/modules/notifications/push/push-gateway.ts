import { Logger } from '@nestjs/common';
import { createSign } from 'node:crypto';
import type { FirebaseServiceAccount } from '../../../config/environment';

export interface PushMessage {
  readonly title: string;
  readonly body: string;
  /** Read by the app when the push is tapped. Strings only (FCM rule). */
  readonly data: Readonly<Record<string, string>>;
  /** high: wake the phone now (your turn, visit soon). */
  readonly urgent: boolean;
}

/** invalid-token: the app was uninstalled or the token rotated; forget it. */
export type PushResult = 'sent' | 'invalid-token' | 'failed';

export interface PushGateway {
  send(token: string, message: PushMessage): Promise<PushResult>;
}

/** Development: writes what would be sent, never the token itself. */
export class LogPushGateway implements PushGateway {
  private readonly logger = new Logger('Push');
  send(token: string, message: PushMessage): Promise<PushResult> {
    this.logger.log(
      `push to …${token.slice(-6)}: ${message.title} — ${message.body}`,
    );
    return Promise.resolve('sent');
  }
}

/** Android notification channel the app creates for these pushes. */
export const PUSH_CHANNEL_ID = 'saxlem_updates';

/**
 * Firebase Cloud Messaging, HTTP v1. Signs in with the service account
 * (a short-lived OAuth token, renewed before it expires) and sends one
 * message per phone.
 */
export class FcmPushGateway implements PushGateway {
  private readonly logger = new Logger('FcmPush');
  private access: { token: string; expiresAt: number } | undefined;

  constructor(
    private readonly account: FirebaseServiceAccount,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async send(token: string, message: PushMessage): Promise<PushResult> {
    let bearer: string;
    try {
      bearer = await this.bearer();
    } catch (error) {
      this.logger.warn(`FCM sign-in failed: ${String(error)}`);
      return 'failed';
    }
    const response = await this.fetcher(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(this.account.projectId)}/messages:send`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            // The app sends its Firebase Installation ID (FCM's current
            // address for a phone; the older "token" field is deprecated).
            fid: token,
            notification: { title: message.title, body: message.body },
            data: message.data,
            android: {
              priority: message.urgent ? 'HIGH' : 'NORMAL',
              notification: { channel_id: PUSH_CHANNEL_ID },
            },
            apns: {
              headers: { 'apns-priority': message.urgent ? '10' : '5' },
              payload: { aps: { sound: 'default' } },
            },
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    ).catch(() => null);
    if (!response) return 'failed';
    if (response.ok) return 'sent';
    if (response.status === 401) this.access = undefined;
    const detail = await response.text().catch(() => '');
    if (
      response.status === 404 ||
      /UNREGISTERED|NOT_FOUND|registration-token-not-registered/.test(detail) ||
      (response.status === 400 &&
        /INVALID_ARGUMENT/.test(detail) &&
        /token/i.test(detail))
    )
      return 'invalid-token';
    this.logger.warn(`FCM send failed with ${response.status}`);
    return 'failed';
  }

  private async bearer(): Promise<string> {
    if (this.access && this.access.expiresAt - 60_000 > this.now())
      return this.access.token;
    const issued = Math.floor(this.now() / 1000);
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
      iss: this.account.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: issued,
      exp: issued + 3600,
    })}`;
    const signature = createSign('RSA-SHA256')
      .update(unsigned)
      .sign(this.account.privateKey.replace(/\\n/g, '\n'))
      .toString('base64url');
    const response = await this.fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${signature}`,
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`token endpoint ${response.status}`);
    const json = (await response.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };
    if (typeof json.access_token !== 'string')
      throw new Error('no access token');
    const seconds =
      typeof json.expires_in === 'number' ? json.expires_in : 3600;
    this.access = {
      token: json.access_token,
      expiresAt: this.now() + seconds * 1000,
    };
    return json.access_token;
  }
}
