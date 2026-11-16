import { Injectable } from '@nestjs/common';
import {
  PaymentGatewayError,
  type GatewayCredentials,
  type GatewayPayment,
  type GatewayPaymentRequest,
  type GatewayPaymentState,
  type PaymentGateway,
} from '../domain/payment-gateway';

/** First Iraqi Bank (FIB) Online Payments. Endpoints follow FIB's official
 * Node SDK (@first-iraqi-bank/sdk 1.5.0). FIB status callbacks are not
 * signed, so callers must always confirm a status with `status()`. */
export const fibBaseUrls: Readonly<Record<string, string>> = Object.freeze({
  stage: 'https://fib-stage.fib.iq',
  prod: 'https://fib.prod.fib.iq',
});
const timeoutMs = 10_000;
// FIB requires refundableFor between 12 hours and 7 days.
const refundableFor = 'P6DT23H';

interface CachedToken {
  readonly value: string;
  readonly expiresAt: number;
}

@Injectable()
export class FibPaymentGateway implements PaymentGateway {
  readonly provider = 'fib' as const;
  private readonly tokens = new Map<string, CachedToken>();

  /** Overridable in tests. */
  protected fetcher: typeof fetch = (input, init) => fetch(input, init);

  async verifyCredentials(credentials: GatewayCredentials) {
    this.tokens.delete(this.cacheKey(credentials));
    await this.token(credentials);
  }

  async create(
    credentials: GatewayCredentials,
    request: GatewayPaymentRequest,
  ): Promise<GatewayPayment> {
    const body = {
      monetaryValue: { amount: request.amountIqd, currency: 'IQD' },
      description: request.description.slice(0, 50),
      expiresIn: `PT${request.expiresInMinutes}M`,
      refundableFor,
      ...(request.statusCallbackUrl
        ? { statusCallbackUrl: request.statusCallbackUrl }
        : {}),
    };
    const json = await this.call(
      credentials,
      'POST',
      '/protected/v1/payments',
      body,
    );
    const paymentId = this.text(json, 'paymentId');
    const validUntil = new Date(this.text(json, 'validUntil'));
    if (Number.isNaN(validUntil.getTime()))
      throw new PaymentGatewayError(
        'unavailable',
        'FIB returned an invalid expiry.',
      );
    return Object.freeze({
      providerPaymentId: paymentId,
      readableCode: this.optionalText(json, 'readableCode'),
      qrCode: this.optionalText(json, 'qrCode'),
      personalAppLink: this.optionalText(json, 'personalAppLink'),
      businessAppLink: this.optionalText(json, 'businessAppLink'),
      validUntil,
    });
  }

  async status(
    credentials: GatewayCredentials,
    providerPaymentId: string,
  ): Promise<GatewayPaymentState> {
    const json = await this.call(
      credentials,
      'GET',
      `/protected/v1/payments/${encodeURIComponent(providerPaymentId)}/status`,
    );
    const status = this.text(json, 'status');
    if (status === 'PAID') {
      const paidAt = new Date(this.optionalText(json, 'paidAt') ?? Date.now());
      // FIB returns paidBy { name, iban }. Only the name is kept.
      const paidBy = json.paidBy;
      const payerName =
        paidBy && typeof paidBy === 'object' && 'name' in paidBy
          ? typeof paidBy.name === 'string'
            ? paidBy.name.slice(0, 200)
            : null
          : null;
      return { status: 'paid', paidAt, payerName };
    }
    if (status === 'UNPAID') {
      const raw = this.optionalText(json, 'validUntil');
      return { status: 'unpaid', validUntil: raw ? new Date(raw) : null };
    }
    if (status === 'DECLINED') {
      const reason = this.optionalText(json, 'decliningReason');
      return {
        status: 'declined',
        reason:
          reason === 'PAYMENT_EXPIRATION'
            ? 'expired'
            : reason === 'PAYMENT_CANCELLATION'
              ? 'cancelled'
              : 'failed',
      };
    }
    throw new PaymentGatewayError(
      'unavailable',
      'FIB returned an unknown status.',
    );
  }

  async cancel(credentials: GatewayCredentials, providerPaymentId: string) {
    await this.call(
      credentials,
      'POST',
      `/protected/v1/payments/${encodeURIComponent(providerPaymentId)}/cancel`,
    );
  }

  async refund(credentials: GatewayCredentials, providerPaymentId: string) {
    await this.call(
      credentials,
      'POST',
      `/protected/v1/payments/${encodeURIComponent(providerPaymentId)}/refund`,
    );
  }

  private baseUrl(credentials: GatewayCredentials) {
    const base = fibBaseUrls[credentials.environment];
    if (!base)
      throw new PaymentGatewayError('credentials', 'Unknown FIB environment.');
    return base;
  }

  private cacheKey(credentials: GatewayCredentials) {
    return `${credentials.environment}:${credentials.clientId}`;
  }

  private async token(credentials: GatewayCredentials) {
    const key = this.cacheKey(credentials);
    const cached = this.tokens.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });
    const response = await this.send(
      `${this.baseUrl(credentials)}/auth/realms/fib-online-shop/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    if (response.status === 400 || response.status === 401)
      throw new PaymentGatewayError(
        'credentials',
        'FIB rejected the credentials.',
      );
    if (!response.ok)
      throw new PaymentGatewayError(
        'unavailable',
        'FIB sign-in is unavailable.',
      );
    const json = (await response.json()) as Record<string, unknown>;
    const value = this.text(json, 'access_token');
    const expiresIn = Number(json.expires_in ?? 60);
    this.tokens.set(key, {
      value,
      expiresAt: Date.now() + Math.max(10, expiresIn - 30) * 1000,
    });
    return value;
  }

  private async call(
    credentials: GatewayCredentials,
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const token = await this.token(credentials);
    const response = await this.send(`${this.baseUrl(credentials)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Application-Type': '3rd-party',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 401) {
      this.tokens.delete(this.cacheKey(credentials));
      throw new PaymentGatewayError(
        'credentials',
        'FIB rejected the access token.',
      );
    }
    if (response.status >= 400 && response.status < 500)
      throw new PaymentGatewayError(
        'rejected',
        `FIB rejected the request (${response.status}).`,
      );
    if (!response.ok)
      throw new PaymentGatewayError(
        'unavailable',
        `FIB is unavailable (${response.status}).`,
      );
    if (response.status === 204) return {};
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new PaymentGatewayError(
        'unavailable',
        'FIB returned invalid JSON.',
      );
    }
  }

  private async send(url: string, init: RequestInit) {
    try {
      return await this.fetcher(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new PaymentGatewayError('unavailable', 'FIB could not be reached.');
    }
  }

  private text(json: Record<string, unknown>, key: string): string {
    const value = json[key];
    if (typeof value !== 'string' || !value)
      throw new PaymentGatewayError(
        'unavailable',
        `FIB response is missing ${key}.`,
      );
    return value;
  }

  private optionalText(json: Record<string, unknown>, key: string) {
    const value = json[key];
    return typeof value === 'string' && value ? value : null;
  }
}
