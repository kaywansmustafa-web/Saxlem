import 'dotenv/config';
import { Client } from 'pg';
import { assertSafeDatabaseUrl } from './database-safety';

const adminUrl = assertSafeDatabaseUrl(
  process.env.MIGRATION_DATABASE_URL,
  'development',
);
const runtimeUrl = assertSafeDatabaseUrl(
  process.env.DATABASE_URL,
  'development',
);
const role = decodeURIComponent(runtimeUrl.username);
const client = new Client({ connectionString: adminUrl.toString() });

async function verify(): Promise<void> {
  await client.connect();
  const result = await client.query<Record<string, boolean>>(
    `SELECT
      has_table_privilege($1, 'billing_plans', 'SELECT') AS "planRead",
      has_table_privilege($1, 'billing_plans', 'INSERT') AS "planInsert",
      has_table_privilege($1, 'commission_ledger_entries', 'INSERT') AS "ledgerInsert",
      has_table_privilege($1, 'commission_ledger_entries', 'UPDATE') AS "ledgerUpdate",
      has_table_privilege($1, 'commission_ledger_entries', 'DELETE') AS "ledgerDelete",
      has_table_privilege($1, 'organization_plan_assignments', 'INSERT') AS "assignmentInsert",
      has_table_privilege($1, 'organization_plan_assignments', 'DELETE') AS "assignmentDelete",
      has_column_privilege($1, 'organization_plan_assignments', 'effective_to', 'UPDATE') AS "assignmentClose",
      has_column_privilege($1, 'organization_plan_assignments', 'plan_id', 'UPDATE') AS "assignmentPlanUpdate",
      has_table_privilege($1, 'billing_statements', 'INSERT') AS "statementInsert",
      has_table_privilege($1, 'billing_statements', 'DELETE') AS "statementDelete",
      has_column_privilege($1, 'billing_statements', 'status', 'UPDATE') AS "statementStatusUpdate",
      has_column_privilege($1, 'billing_statements', 'organization_id', 'UPDATE') AS "statementTenantUpdate",
      has_table_privilege($1, 'billing_statement_lines', 'INSERT') AS "lineInsert",
      has_table_privilege($1, 'billing_statement_lines', 'UPDATE') AS "lineUpdate",
      has_table_privilege($1, 'billing_statement_lines', 'DELETE') AS "lineDelete"`,
    [role],
  );
  const value = result.rows[0];
  const unsafe = [
    !value?.planRead && 'planRead',
    value?.planInsert && 'planInsert',
    !value?.ledgerInsert && 'ledgerInsert',
    value?.ledgerUpdate && 'ledgerUpdate',
    value?.ledgerDelete && 'ledgerDelete',
    !value?.assignmentInsert && 'assignmentInsert',
    value?.assignmentDelete && 'assignmentDelete',
    !value?.assignmentClose && 'assignmentClose',
    value?.assignmentPlanUpdate && 'assignmentPlanUpdate',
    !value?.statementInsert && 'statementInsert',
    value?.statementDelete && 'statementDelete',
    !value?.statementStatusUpdate && 'statementStatusUpdate',
    value?.statementTenantUpdate && 'statementTenantUpdate',
    !value?.lineInsert && 'lineInsert',
    value?.lineUpdate && 'lineUpdate',
    value?.lineDelete && 'lineDelete',
  ].filter(Boolean);
  if (unsafe.length)
    throw new Error(
      `Billing runtime privileges are unsafe: ${unsafe.join(', ')}`,
    );
}

void verify().finally(() => client.end());
