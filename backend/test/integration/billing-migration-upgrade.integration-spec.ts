import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { assertSafeDatabaseUrl } from '../../scripts/database-safety';

const billingMigration = '20260810010000_billing_foundation';

describe('Sprint 13T representative pre-Billing upgrade', () => {
  it('preserves historical appointments without inferring debt or origin', async () => {
    const base = assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'test');
    const database = `saxlem_billing_upgrade_${Date.now()}`;
    const admin = new Client({
      connectionString: databaseUrl(base, 'postgres'),
    });
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`);
    const target = new Client({
      connectionString: databaseUrl(base, database),
    });
    try {
      await target.connect();
      const root = join(process.cwd(), 'prisma', 'migrations');
      const migrations = readdirSync(root)
        .filter((name) => name < billingMigration)
        .sort();
      for (const migration of migrations)
        await target.query(
          readFileSync(join(root, migration, 'migration.sql'), 'utf8'),
        );

      const ids = {
        organization: randomUUID(),
        clinic: randomUUID(),
        doctorUser: randomUUID(),
        staff: randomUUID(),
        doctor: randomUUID(),
        patientUser: randomUUID(),
        account: randomUUID(),
        profile: randomUUID(),
      };
      await target.query(
        `INSERT INTO organizations (id,name,created_at,updated_at) VALUES ($1,'Historical Clinic Group','2020-01-01',now())`,
        [ids.organization],
      );
      await target.query(
        `INSERT INTO clinics (id,organization_id,name,code,timezone,created_at,updated_at)
         VALUES ($1,$2,'Historical Clinic','historic','Asia/Baghdad','2020-01-01',now())`,
        [ids.clinic, ids.organization],
      );
      await target.query(
        `INSERT INTO users (id,created_at,updated_at) VALUES ($1,now(),now()),($2,now(),now())`,
        [ids.doctorUser, ids.patientUser],
      );
      await target.query(
        `INSERT INTO staff_accounts (id,user_id,email,created_at,updated_at)
         VALUES ($1,$2,'upgrade-doctor@example.invalid',now(),now())`,
        [ids.staff, ids.doctorUser],
      );
      await target.query('BEGIN');
      await target.query(
        `INSERT INTO doctors (id,organization_id,staff_account_id,first_name,last_name,display_name,gender,license_number,years_of_experience,languages,created_at,updated_at)
         VALUES ($1,$2,$3,'Upgrade','Doctor','Dr. Upgrade','unspecified','UPGRADE-1',5,ARRAY['english'],now(),now())`,
        [ids.doctor, ids.organization, ids.staff],
      );
      await target.query(
        `INSERT INTO doctor_clinic_assignments (organization_id,clinic_id,doctor_id,created_at)
         VALUES ($1,$2,$3,now())`,
        [ids.organization, ids.clinic, ids.doctor],
      );
      await target.query('COMMIT');
      await target.query(
        `INSERT INTO patient_accounts (id,user_id,normalized_phone_number,created_at,updated_at)
         VALUES ($1,$2,'+9647500000099',now(),now())`,
        [ids.account, ids.patientUser],
      );
      await target.query(
        `INSERT INTO patient_profiles (id,patient_account_id,first_name,last_name,date_of_birth,created_at,updated_at)
         VALUES ($1,$2,'Historical','Patient','1990-01-01',now(),now())`,
        [ids.profile, ids.account],
      );
      await target.query(
        `INSERT INTO organization_patient_profiles (organization_id,patient_profile_id,created_at)
         VALUES ($1,$2,now())`,
        [ids.organization, ids.profile],
      );
      const appointments = [
        ['initial', 'completed', '2026-08-09T10:00:00Z'],
        ['followUp', 'completed', '2026-08-09T11:00:00Z'],
        ['initial', 'completed', '2025-01-01T10:00:00Z'],
        ['initial', 'scheduled', '2026-09-01T10:00:00Z'],
      ] as const;
      for (const [type, status, startsAt] of appointments)
        await target.query(
          `INSERT INTO appointments
           (id,organization_id,clinic_id,doctor_id,patient_profile_id,type,reason,starts_at,duration_minutes,fee_iqd,status,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'Historical consultation',$7,20,25000,$8,'2020-01-01',now())`,
          [
            randomUUID(),
            ids.organization,
            ids.clinic,
            ids.doctor,
            ids.profile,
            type,
            startsAt,
            status,
          ],
        );

      expect(
        (
          await target.query<{ count: number }>(
            `SELECT count(*)::int AS count FROM appointments`,
          )
        ).rows[0]?.count,
      ).toBe(4);
      await target.query(
        readFileSync(join(root, billingMigration, 'migration.sql'), 'utf8'),
      );

      const migrated = await target.query<{ origin: string | null }>(
        `SELECT origin FROM appointments ORDER BY public_reference`,
      );
      expect(migrated.rows).toHaveLength(4);
      expect(migrated.rows.every(({ origin }) => origin === null)).toBe(true);
      expect(
        (
          await target.query<{ count: number }>(
            `SELECT count(*)::int AS count FROM commission_ledger_entries`,
          )
        ).rows[0]?.count,
      ).toBe(0);
      expect(
        (
          await target.query<{ count: number }>(
            `SELECT count(*)::int AS count FROM billing_statements`,
          )
        ).rows[0]?.count,
      ).toBe(0);
      const plan = await target.query<{ code: string; amount: number }>(
        `SELECT code,commission_amount_iqd AS amount FROM billing_plans`,
      );
      expect(plan.rows).toEqual([{ code: 'STANDARD_1250', amount: 1250 }]);
      const assignment = await target.query<{ effective_from: Date }>(
        `SELECT effective_from FROM organization_plan_assignments WHERE organization_id=$1`,
        [ids.organization],
      );
      expect(assignment.rows[0]?.effective_from.toISOString()).toBe(
        '2026-08-10T00:00:00.000Z',
      );
      const triggers = await target.query<{ tgname: string }>(
        `SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname IN
         ('commission_reversal_full_and_linked','billing_statement_line_valid','billing_statement_breakdown_valid','billing_statement_immutable_after_finalization')`,
      );
      expect(new Set(triggers.rows.map(({ tgname }) => tgname))).toEqual(
        new Set([
          'commission_reversal_full_and_linked',
          'billing_statement_line_valid',
          'billing_statement_breakdown_valid',
          'billing_statement_immutable_after_finalization',
        ]),
      );
    } finally {
      await target.end().catch(() => undefined);
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.end();
    }
  }, 60_000);
});

function databaseUrl(base: URL, database: string): string {
  const copy = new URL(base.toString());
  copy.pathname = `/${database}`;
  return copy.toString();
}
