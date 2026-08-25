import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Billing v1 architecture', () => {
  const root = join(__dirname, '../..');
  const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
  const migration = readFileSync(
    join(
      root,
      'prisma/migrations/20260810010000_billing_foundation/migration.sql',
    ),
    'utf8',
  );

  it('locks origin, exactly-once ledger, assignment overlap, and immutable history in PostgreSQL', () => {
    expect(migration).toContain('appointment_origin_required');
    expect(migration).toContain('appointment_origin_immutable');
    expect(migration).toContain('organization_plan_assignments_no_overlap');
    expect(migration).toContain('commission_one_earned_per_appointment');
    expect(migration).toContain('commission_one_reversal_per_original');
    expect(migration).toContain('commission_ledger_immutable');
    expect(migration).toContain(
      'billing_statement_immutable_after_finalization',
    );
    expect(migration).toContain('2026-08-10T00:00:00.000Z');
    expect(schema).toContain('origin              AppointmentOrigin?');
  });

  it('contains no payment-provider or patient clinical billing fields', () => {
    const billing = readFileSync(
      join(root, 'src/modules/billing/presentation/billing.dto.ts'),
      'utf8',
    );
    for (const forbidden of [
      'Stripe',
      'PayPal',
      'FastPay',
      'patientName',
      'phoneNumber',
      'dateOfBirth',
      'appointmentReason',
    ])
      expect(billing).not.toContain(forbidden);
  });
});
