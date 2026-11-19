import { PaymentGatewayError } from '../domain/payment-gateway';
import { FibPaymentGateway } from './fib-payment-gateway';

type Call = { url: string; init: RequestInit };

class TestGateway extends FibPaymentGateway {
  calls: Call[] = [];
  responses: Response[] = [];
  constructor() {
    super();
    this.fetcher = (input, init) => {
      this.calls.push({
        url: input instanceof Request ? input.url : input.toString(),
        init: init ?? {},
      });
      const next = this.responses.shift();
      return next
        ? Promise.resolve(next)
        : Promise.reject(new Error('offline'));
    };
  }
}

const credentials = {
  provider: 'fib' as const,
  environment: 'stage',
  clientId: 'client',
  clientSecret: 'secret',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const token = () => json({ access_token: 'token-1', expires_in: 300 });

describe('FibPaymentGateway', () => {
  it('signs in with client credentials and creates an IQD payment', async () => {
    const gateway = new TestGateway();
    gateway.responses.push(
      token(),
      json(
        {
          paymentId: 'pay-1',
          readableCode: 'AB12',
          qrCode: 'data:image/png;base64,AA',
          personalAppLink: 'https://personal',
          businessAppLink: 'https://business',
          validUntil: '2026-11-16T12:00:00Z',
        },
        202,
      ),
    );
    const payment = await gateway.create(credentials, {
      amountIqd: 25000,
      description: 'Saxlem SX-2026-000001 with a long description here',
      expiresInMinutes: 30,
      statusCallbackUrl: 'https://api.example/cb/token',
    });
    expect(payment.providerPaymentId).toBe('pay-1');
    expect(gateway.calls[0]!.url).toBe(
      'https://fib-stage.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token',
    );
    expect(
      (gateway.calls[0]!.init.body as URLSearchParams).toString(),
    ).toContain('grant_type=client_credentials');
    const body = JSON.parse(gateway.calls[1]!.init.body as string) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      monetaryValue: { amount: 25000, currency: 'IQD' },
      expiresIn: 'PT30M',
      refundableFor: 'P6DT23H',
      statusCallbackUrl: 'https://api.example/cb/token',
    });
    expect((body.description as string).length).toBeLessThanOrEqual(50);
    expect(
      (gateway.calls[1]!.init.headers as Record<string, string>).Authorization,
    ).toBe('Bearer token-1');
  });

  it('reuses the access token and maps statuses', async () => {
    const gateway = new TestGateway();
    gateway.responses.push(
      token(),
      json({ status: 'PAID', paidAt: '2026-11-16T10:00:00Z' }),
      json({ status: 'DECLINED', decliningReason: 'PAYMENT_EXPIRATION' }),
      json({ status: 'UNPAID', validUntil: '2026-11-16T12:00:00Z' }),
    );
    expect((await gateway.status(credentials, 'p')).status).toBe('paid');
    expect(await gateway.status(credentials, 'p')).toEqual({
      status: 'declined',
      reason: 'expired',
    });
    expect((await gateway.status(credentials, 'p')).status).toBe('unpaid');
    expect(gateway.calls.filter((c) => c.url.includes('/token'))).toHaveLength(
      1,
    );
  });

  it('reports rejected credentials, rejected requests and outages distinctly', async () => {
    const rejectedLogin = new TestGateway();
    rejectedLogin.responses.push(new Response('', { status: 401 }));
    await expect(
      rejectedLogin.verifyCredentials(credentials),
    ).rejects.toMatchObject({
      kind: 'credentials',
    });

    const rejected = new TestGateway();
    rejected.responses.push(token(), new Response('', { status: 406 }));
    await expect(rejected.refund(credentials, 'p')).rejects.toMatchObject({
      kind: 'rejected',
    });

    const offline = new TestGateway();
    await expect(offline.status(credentials, 'p')).rejects.toBeInstanceOf(
      PaymentGatewayError,
    );
    await expect(offline.status(credentials, 'p')).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });

  it('refuses unknown environments', async () => {
    await expect(
      new TestGateway().verifyCredentials({
        ...credentials,
        environment: 'dev',
      }),
    ).rejects.toMatchObject({ kind: 'credentials' });
  });
});
