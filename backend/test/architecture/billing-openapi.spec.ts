import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Billing OpenAPI', () => {
  const document = JSON.parse(
    readFileSync(join(__dirname, '../../openapi/saxlem-api.json'), 'utf8'),
  ) as {
    paths: Record<string, unknown>;
    components: {
      schemas: Record<string, { properties?: Record<string, unknown> }>;
    };
  };

  it('documents all Billing v1 routes and integer-IQD schemas', () => {
    for (const path of [
      '/api/v1/billing/plans',
      '/api/v1/billing/organizations/{organizationId}/plan',
      '/api/v1/billing/organizations/{organizationId}/plan-assignments',
      '/api/v1/billing/commissions',
      '/api/v1/billing/statements',
      '/api/v1/billing/statements/current',
      '/api/v1/billing/statements/{id}',
      '/api/v1/billing/statements/{id}/finalize',
      '/api/v1/billing/plans/{id}/status',
      '/api/v1/billing/organizations/{organizationId}/setup',
      '/api/v1/billing/organizations/{organizationId}/cycle-start',
      '/api/v1/billing/organizations/{organizationId}/plan-changes',
      '/api/v1/billing/organizations/{organizationId}/doctors/{doctorId}/plan',
      '/api/v1/billing/commissions/{id}/credit',
    ])
      expect(document.paths).toHaveProperty(path);
    const plan =
      document.components.schemas.BillingPlanResponseDto!.properties!;
    // 0 IQD makes a free (pilot) plan.
    expect(plan.commissionAmountIqd).toMatchObject({
      type: 'integer',
      minimum: 0,
    });
    const statement =
      document.components.schemas.BillingStatementResponseDto!.properties!;
    for (const property of [
      'grossEarnedIqd',
      'reversalsIqd',
      'netCommissionIqd',
      'qualifyingCount',
      'reversalCount',
      'version',
    ])
      expect(statement[property]).toMatchObject({ type: 'integer' });
    const billingSchemas = Object.fromEntries(
      Object.entries(document.components.schemas).filter(([name]) =>
        /Billing|Commission|OrganizationPlan/u.test(name),
      ),
    );
    expect(JSON.stringify(billingSchemas)).not.toContain('patientName');
  });
});
