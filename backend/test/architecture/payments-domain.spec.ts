import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('appointment payments architecture', () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');

  it('keeps Prisma behind the repository', () => {
    for (const path of [
      'src/modules/payments/presentation/payments.controller.ts',
      'src/modules/payments/application/payment.service.ts',
    ])
      expect(source(path)).not.toContain('@prisma/client');
  });

  it('never exposes provider secrets or callback tokens', () => {
    const dto = source('src/modules/payments/presentation/payment.dto.ts');
    const responseDtos = dto.slice(
      dto.indexOf('export class PaymentOnlineDetailsDto'),
    );
    expect(responseDtos).not.toMatch(/clientSecret|callbackToken|Ciphertext/);
    const domain = source('src/modules/payments/domain/payment.ts');
    const projection = domain.slice(
      domain.indexOf('export interface PaymentProjection'),
    );
    expect(projection.slice(0, projection.indexOf('}\n\n'))).not.toMatch(
      /callbackToken|clientSecret/,
    );
  });

  it('confirms every provider callback with the provider and refuses simulation in production', () => {
    const service = source(
      'src/modules/payments/application/payment.service.ts',
    );
    expect(service).toMatch(/handleCallback[\s\S]*syncQuietly/);
    expect(service).toMatch(
      /provider === 'simulated' &&\s+this\.configuration\.environment === 'production'/,
    );
  });

  it('keeps payout totals consistent in the database', () => {
    const migration = source(
      'prisma/migrations/20261117090000_platform_collection_payouts/migration.sql',
    );
    expect(migration).toContain('"net_payable_iqd" = "gross_collected_iqd"');
    expect(migration).toContain(
      'organization_payouts_organization_id_period_start_key',
    );
  });

  it('encodes the payment invariants in the database', () => {
    const migration = source(
      'prisma/migrations/20261116090000_appointment_payments/migration.sql',
    );
    for (const invariant of [
      'appointment_payments_method_shape_check',
      'appointment_payments_paid_at_check',
      'appointment_payments_counter_recorder_check',
      'organization_payment_accounts_secret_check',
    ])
      expect(migration).toContain(invariant);
  });

  it('publishes the payment routes in OpenAPI', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      paths: Record<string, unknown>;
    };
    for (const route of [
      '/api/v1/payments/options',
      '/api/v1/payments',
      '/api/v1/appointments/{id}/payment',
      '/api/v1/appointments/{id}/payment/refresh',
      '/api/v1/appointments/{id}/payment/counter',
      '/api/v1/payments/fib/callback/{token}',
      '/api/v1/platform/organizations/{organizationId}/payment-account',
      '/api/v1/platform/payments/settings',
      '/api/v1/platform/payments/ledger',
      '/api/v1/statements',
      '/api/v1/statements/{organizationId}/{doctorId}/{cycleNumber}',
      '/api/v1/platform/organizations/{organizationId}/doctors/{doctorId}/statements/{cycleNumber}/settlement',
      '/api/v1/platform/organizations/{organizationId}/doctors/{doctorId}/payout-profile',
      '/api/v1/platform/organizations/{organizationId}/payout-profile',
    ])
      expect(document.paths).toHaveProperty(route);
  });
});
