import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  PaymentGatewayError,
  type GatewayCredentials,
  type GatewayPayment,
  type GatewayPaymentRequest,
  type GatewayPaymentState,
  type PaymentGateway,
} from '../domain/payment-gateway';

/** Development-only stand-in for a real provider. A payment counts as paid a
 * few seconds after it is created, so the whole flow can be demonstrated
 * without a bank. The service refuses this provider in production. */
export const simulatedPaidAfterMs = 8_000;

@Injectable()
export class SimulatedPaymentGateway implements PaymentGateway {
  readonly provider = 'simulated' as const;
  private readonly closed = new Map<string, 'cancelled'>();

  verifyCredentials(credentials: GatewayCredentials) {
    if (credentials.clientSecret.length < 8)
      return Promise.reject(
        new PaymentGatewayError(
          'credentials',
          'Simulated secret is too short.',
        ),
      );
    return Promise.resolve();
  }

  create(
    _credentials: GatewayCredentials,
    request: GatewayPaymentRequest,
  ): Promise<GatewayPayment> {
    return Promise.resolve(this.newPayment(request));
  }

  private newPayment(request: GatewayPaymentRequest): GatewayPayment {
    const created = Date.now();
    const id = `sim-${created}-${randomBytes(6).toString('hex')}`;
    const code = randomBytes(4).toString('hex').toUpperCase();
    return Object.freeze({
      providerPaymentId: id,
      readableCode: `${code.slice(0, 4)}-${code.slice(4)}`,
      qrCode: null,
      personalAppLink: null,
      businessAppLink: null,
      validUntil: new Date(created + request.expiresInMinutes * 60_000),
    });
  }

  status(
    _credentials: GatewayCredentials,
    providerPaymentId: string,
  ): Promise<GatewayPaymentState> {
    try {
      return Promise.resolve(this.state(providerPaymentId));
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }

  private state(providerPaymentId: string): GatewayPaymentState {
    if (this.closed.has(providerPaymentId))
      return { status: 'declined', reason: 'cancelled' };
    const created = Number(providerPaymentId.split('-')[1]);
    if (!Number.isFinite(created))
      throw new PaymentGatewayError('rejected', 'Unknown simulated payment.');
    if (Date.now() - created >= simulatedPaidAfterMs)
      return {
        status: 'paid',
        paidAt: new Date(created + simulatedPaidAfterMs),
      };
    return { status: 'unpaid', validUntil: null };
  }

  cancel(_credentials: GatewayCredentials, providerPaymentId: string) {
    this.closed.set(providerPaymentId, 'cancelled');
    return Promise.resolve();
  }

  refund() {
    return Promise.resolve();
  }
}
