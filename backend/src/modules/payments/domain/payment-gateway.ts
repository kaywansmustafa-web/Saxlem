import type { PaymentProvider } from './payment';

export interface GatewayCredentials {
  readonly provider: PaymentProvider;
  readonly environment: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface GatewayPaymentRequest {
  readonly amountIqd: number;
  readonly description: string;
  readonly expiresInMinutes: number;
  readonly statusCallbackUrl?: string | undefined;
}

export interface GatewayPayment {
  readonly providerPaymentId: string;
  readonly readableCode: string | null;
  readonly qrCode: string | null;
  readonly personalAppLink: string | null;
  readonly businessAppLink: string | null;
  readonly validUntil: Date;
}

export type GatewayPaymentState =
  | {
      readonly status: 'paid';
      readonly paidAt: Date;
      /** Name on the paying FIB account, when the provider shares it. */
      readonly payerName?: string | null;
    }
  | { readonly status: 'unpaid'; readonly validUntil: Date | null }
  | {
      readonly status: 'declined';
      readonly reason: 'expired' | 'cancelled' | 'failed';
    };

export type GatewayErrorKind = 'unavailable' | 'rejected' | 'credentials';

export class PaymentGatewayError extends Error {
  constructor(
    readonly kind: GatewayErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** One payment provider (FIB, or the simulated one for development). */
export interface PaymentGateway {
  readonly provider: PaymentProvider;
  verifyCredentials(credentials: GatewayCredentials): Promise<void>;
  create(
    credentials: GatewayCredentials,
    request: GatewayPaymentRequest,
  ): Promise<GatewayPayment>;
  status(
    credentials: GatewayCredentials,
    providerPaymentId: string,
  ): Promise<GatewayPaymentState>;
  cancel(
    credentials: GatewayCredentials,
    providerPaymentId: string,
  ): Promise<void>;
  refund(
    credentials: GatewayCredentials,
    providerPaymentId: string,
  ): Promise<void>;
}

export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
