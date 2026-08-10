import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  BILLING_ACTIVATION_AT,
  type BillingAccess,
  type BillingCommand,
  type BillingCursor,
  type BillingPeriod,
} from '../domain/billing';
import type { BillingRepository } from '../domain/billing.repository';

@Injectable()
export class PrismaBillingRepository implements BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  plans() {
    return this.prisma.db.billingPlan
      .findMany({ orderBy: { code: 'asc' } })
      .then((rows) => Object.freeze(rows.map(this.planRecord)));
  }
  plan(id: string) {
    return this.prisma.db.billingPlan
      .findUnique({ where: { id } })
      .then((row) => (row ? this.planRecord(row) : null));
  }
  organizationPlan(organizationId: string, at: Date) {
    return this.prisma.db.organizationPlanAssignment
      .findFirst({
        where: {
          organizationId,
          effectiveFrom: { lte: at },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
        },
        include: { plan: true },
        orderBy: { effectiveFrom: 'desc' },
      })
      .then((row) => (row ? this.assignmentRecord(row) : null));
  }

  assignPlan(
    access: BillingAccess,
    organizationId: string,
    planId: string,
    effectiveFrom: Date,
    expectedVersion: number | null,
    requestId: string,
    command: BillingCommand,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-plan:${organizationId}`}, 0))`;
      const replay = await this.claim(tx, access.actorId, command);
      if (replay) return replay;
      const [organization, plan, current] = await Promise.all([
        tx.organization.findFirst({
          where: { id: organizationId, status: 'active' },
          select: { id: true },
        }),
        tx.billingPlan.findFirst({ where: { id: planId, status: 'active' } }),
        tx.organizationPlanAssignment.findFirst({
          where: { organizationId, effectiveTo: null },
          orderBy: { effectiveFrom: 'desc' },
        }),
      ]);
      if (!organization || !plan)
        throw new NotFoundException(
          'Organization or billing plan was not found.',
        );
      if (current) {
        if (
          expectedVersion !== current.version ||
          effectiveFrom <= current.effectiveFrom
        )
          throw new ConflictException(
            'Billing plan assignment version or effective date is stale.',
          );
        const changed = await tx.organizationPlanAssignment.updateMany({
          where: {
            id: current.id,
            version: current.version,
            effectiveTo: null,
          },
          data: { effectiveTo: effectiveFrom, version: { increment: 1 } },
        });
        if (changed.count !== 1)
          throw new ConflictException('Billing plan assignment is stale.');
      } else if (expectedVersion !== null)
        throw new ConflictException('Billing plan assignment is stale.');
      const row = await tx.organizationPlanAssignment.create({
        data: { organizationId, planId, effectiveFrom },
        include: { plan: true },
      });
      const result = this.assignmentRecord(row);
      await this.events(
        tx,
        access.actorId,
        organizationId,
        null,
        'billing.plan.assigned',
        'OrganizationPlanAssignment',
        row.id,
        requestId,
        { planId, effectiveFrom: effectiveFrom.toISOString() },
      );
      await this.complete(tx, access.actorId, command, result, 201);
      return result;
    });
  }

  async commissions(
    access: BillingAccess,
    organizationId: string,
    pageSize: number,
    cursor?: BillingCursor,
  ) {
    const rows = await this.prisma.db.commissionLedgerEntry.findMany({
      where: {
        organizationId,
        ...(cursor
          ? {
              OR: [
                { recognizedAt: { lt: cursor.recognizedAt } },
                { recognizedAt: cursor.recognizedAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ recognizedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      include: {
        appointment: { select: { publicReference: true } },
        plan: { select: { code: true } },
      },
    });
    const items = rows.slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(items.map(this.commissionRecord)),
      next:
        rows.length > pageSize && items.length
          ? { recognizedAt: items.at(-1)!.recognizedAt, id: items.at(-1)!.id }
          : null,
    });
  }

  statements(access: BillingAccess, organizationId: string) {
    return this.prisma.db.billingStatement
      .findMany({ where: { organizationId }, orderBy: { periodStart: 'desc' } })
      .then((rows) => Object.freeze(rows.map(this.statementRecord)));
  }
  async statement(access: BillingAccess, id: string) {
    const row = await this.prisma.db.billingStatement.findFirst({
      where: {
        id,
        ...(access.platformAdministrator
          ? {}
          : { organizationId: access.organizationId }),
      },
      include: {
        lines: { orderBy: [{ recognizedAt: 'asc' }, { id: 'asc' }] },
        clinicBreakdowns: true,
      },
    });
    return row ? this.statementRecord(row) : null;
  }

  currentStatement(
    access: BillingAccess,
    organizationId: string,
    period: BillingPeriod,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const totals = await this.totals(tx, organizationId, period);
      const row = await tx.billingStatement.upsert({
        where: {
          organizationId_periodStart: {
            organizationId,
            periodStart: period.start,
          },
        },
        create: {
          organizationId,
          periodStart: period.start,
          periodEnd: period.end,
          ...totals,
        },
        update: totals,
      });
      return this.statementRecord(row);
    });
  }

  finalize(
    access: BillingAccess,
    id: string,
    version: number,
    requestId: string,
    command: BillingCommand,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-statement:${id}`}, 0))`;
      const replay = await this.claim(tx, access.actorId, command);
      if (replay) return replay;
      const statement = await tx.billingStatement.findUnique({ where: { id } });
      if (!statement)
        throw new NotFoundException('Billing statement was not found.');
      if (statement.status === 'finalized')
        throw new ConflictException('Billing statement is already finalized.');
      if (statement.version !== version)
        throw new ConflictException('Billing statement version is stale.');
      if (statement.periodEnd > new Date())
        throw new ConflictException(
          'The current billing month cannot be finalized.',
        );
      const entries = await tx.commissionLedgerEntry.findMany({
        where: {
          organizationId: statement.organizationId,
          recognizedAt: { gte: statement.periodStart, lt: statement.periodEnd },
        },
        include: { appointment: { select: { publicReference: true } } },
        orderBy: [{ recognizedAt: 'asc' }, { id: 'asc' }],
      });
      const totals = this.aggregate(entries);
      if (entries.length)
        await tx.billingStatementLine.createMany({
          data: entries.map((entry) => ({
            statementId: id,
            ledgerEntryId: entry.id,
            clinicId: entry.clinicId,
            appointmentId: entry.appointmentId,
            appointmentReference: entry.appointment.publicReference,
            recognizedAt: entry.recognizedAt,
            status: entry.status,
            amountIqd: entry.amountIqd,
            netAmountIqd:
              entry.status === 'earned' ? entry.amountIqd : -entry.amountIqd,
            currency: 'IQD',
          })),
        });
      for (const [clinicId, values] of this.byClinic(entries))
        await tx.billingStatementClinicBreakdown.create({
          data: { statementId: id, clinicId, ...values },
        });
      const changed = await tx.billingStatement.updateMany({
        where: { id, version, status: 'draft' },
        data: {
          ...totals,
          status: 'finalized',
          finalizedAt: new Date(),
          finalizedById: access.actorId,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1)
        throw new ConflictException('Billing statement version is stale.');
      const result = this.statementRecord(
        (await tx.billingStatement.findUnique({ where: { id } }))!,
      );
      await this.events(
        tx,
        access.actorId,
        statement.organizationId,
        null,
        'billing.statement.finalized',
        'BillingStatement',
        id,
        requestId,
        {
          periodStart: statement.periodStart.toISOString(),
          periodEnd: statement.periodEnd.toISOString(),
        },
      );
      await this.complete(tx, access.actorId, command, result, 200);
      return result;
    });
  }

  async materializeCompletion(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    completedAt: Date,
    actorId: string,
    requestId: string,
  ) {
    if (completedAt < BILLING_ACTIVATION_AT) return;
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        organizationId: true,
        clinicId: true,
        type: true,
        origin: true,
        status: true,
      },
    });
    if (
      !appointment ||
      appointment.status !== 'completed' ||
      appointment.type !== 'initial' ||
      appointment.origin !== 'patientBooked'
    )
      return;
    const assignment = await tx.organizationPlanAssignment.findFirst({
      where: {
        organizationId: appointment.organizationId,
        effectiveFrom: { lte: completedAt },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: completedAt } }],
        plan: {
          status: 'active',
          ruleCode: 'QUALIFYING_INITIAL_PATIENT_BOOKED_COMPLETION',
          ruleVersion: 1,
        },
      },
      include: { plan: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!assignment) return;
    const existing = await tx.commissionLedgerEntry.findFirst({
      where: { appointmentId, status: 'earned' },
      select: { id: true },
    });
    if (existing) return;
    const row = await tx.commissionLedgerEntry.create({
      data: {
        organizationId: appointment.organizationId,
        clinicId: appointment.clinicId,
        appointmentId,
        planId: assignment.planId,
        amountIqd: assignment.plan.commissionAmountIqd,
        currency: 'IQD',
        ruleCode: assignment.plan.ruleCode,
        ruleVersion: assignment.plan.ruleVersion,
        planVersion: assignment.plan.version,
        appointmentType: appointment.type,
        appointmentOrigin: appointment.origin,
        completedAt,
        recognizedAt: completedAt,
        status: 'earned',
      },
    });
    await this.events(
      tx,
      actorId,
      appointment.organizationId,
      appointment.clinicId,
      'billing.commission.earned',
      'CommissionLedgerEntry',
      row.id,
      requestId,
      {
        appointmentId,
        amountIqd: row.amountIqd,
        currency: 'IQD',
        ruleCode: row.ruleCode,
        ruleVersion: row.ruleVersion,
      },
    );
  }

  private async totals(
    tx: Prisma.TransactionClient,
    organizationId: string,
    period: BillingPeriod,
    clinicId?: string,
  ) {
    const entries = await tx.commissionLedgerEntry.findMany({
      where: {
        organizationId,
        ...(clinicId ? { clinicId } : {}),
        recognizedAt: { gte: period.start, lt: period.end },
      },
    });
    return this.aggregate(entries);
  }
  private aggregate(
    entries: readonly { status: 'earned' | 'reversed'; amountIqd: number }[],
  ) {
    const grossEarnedIqd = entries
        .filter((x) => x.status === 'earned')
        .reduce((sum, x) => sum + x.amountIqd, 0),
      reversalsIqd = entries
        .filter((x) => x.status === 'reversed')
        .reduce((sum, x) => sum + x.amountIqd, 0);
    return {
      grossEarnedIqd,
      reversalsIqd,
      netCommissionIqd: grossEarnedIqd - reversalsIqd,
      qualifyingCount: entries.filter((x) => x.status === 'earned').length,
      reversalCount: entries.filter((x) => x.status === 'reversed').length,
    };
  }
  private byClinic(
    entries: readonly {
      clinicId: string;
      status: 'earned' | 'reversed';
      amountIqd: number;
    }[],
  ) {
    const groups = new Map<string, typeof entries>();
    for (const entry of entries)
      groups.set(entry.clinicId, [
        ...(groups.get(entry.clinicId) ?? []),
        entry,
      ]);
    return [...groups].map(
      ([clinicId, rows]) => [clinicId, this.aggregate(rows)] as const,
    );
  }
  private async claim(
    tx: Prisma.TransactionClient,
    actorId: string,
    command: BillingCommand,
  ): Promise<Readonly<Record<string, unknown>> | null> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${actorId}:${command.scope}:${command.key}`}, 0))`;
    const row = await tx.idempotencyRecord.findUnique({
      where: {
        actorId_scope_key: { actorId, scope: command.scope, key: command.key },
      },
    });
    if (row) {
      if (row.requestHash !== command.hash || !row.responseBody)
        throw new ConflictException(
          'Idempotency key was already used for a different request.',
        );
      if (
        typeof row.responseBody !== 'object' ||
        row.responseBody === null ||
        Array.isArray(row.responseBody)
      )
        throw new ConflictException(
          'Idempotent response is unavailable or invalid.',
        );
      return row.responseBody;
    }
    await tx.idempotencyRecord.create({
      data: {
        actorId,
        scope: command.scope,
        key: command.key,
        requestHash: command.hash,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    return null;
  }
  private complete(
    tx: Prisma.TransactionClient,
    actorId: string,
    command: BillingCommand,
    result: unknown,
    responseCode: number,
  ) {
    return tx.idempotencyRecord.update({
      where: {
        actorId_scope_key: { actorId, scope: command.scope, key: command.key },
      },
      data: { responseCode, responseBody: result as Prisma.InputJsonValue },
    });
  }
  private events(
    tx: Prisma.TransactionClient,
    actorId: string,
    organizationId: string,
    clinicId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    requestId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    const occurredAt = new Date();
    return Promise.all([
      tx.auditEvent.create({
        data: {
          organizationId,
          clinicId,
          actorUserId: actorId,
          action,
          targetType,
          targetId,
          outcome: 'succeeded',
          requestId,
          metadata,
          occurredAt,
        },
      }),
      tx.outboxEvent.create({
        data: {
          aggregateType: targetType,
          aggregateId: targetId,
          eventType: action,
          payload: {
            organizationId,
            ...(clinicId ? { clinicId } : {}),
            targetId,
          },
          occurredAt,
        },
      }),
    ]).then(() => undefined);
  }
  private planRecord = (row: {
    id: string;
    code: string;
    displayName: string;
    status: 'active' | 'inactive';
    currency: string;
    commissionAmountIqd: number;
    ruleCode: string;
    ruleVersion: number;
    version: number;
  }) => Object.freeze({ ...row });
  private assignmentRecord = (row: {
    id: string;
    organizationId: string;
    planId: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    version: number;
    plan: Parameters<PrismaBillingRepository['planRecord']>[0];
  }) =>
    Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      effectiveFrom: row.effectiveFrom.toISOString(),
      effectiveTo: row.effectiveTo?.toISOString() ?? null,
      version: row.version,
      plan: this.planRecord(row.plan),
    });
  private commissionRecord = (row: {
    id: string;
    organizationId: string;
    clinicId: string;
    appointmentId: string;
    amountIqd: number;
    currency: string;
    ruleCode: string;
    ruleVersion: number;
    planVersion: number;
    completedAt: Date;
    recognizedAt: Date;
    status: 'earned' | 'reversed';
    originalCommissionId: string | null;
    plan: { code: string };
    appointment: { publicReference: string };
  }) =>
    Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      appointmentId: row.appointmentId,
      appointmentReference: row.appointment.publicReference,
      planCode: row.plan.code,
      amountIqd: row.amountIqd,
      currency: row.currency,
      ruleCode: row.ruleCode,
      ruleVersion: row.ruleVersion,
      planVersion: row.planVersion,
      completedAt: row.completedAt.toISOString(),
      recognizedAt: row.recognizedAt.toISOString(),
      status: row.status,
      originalCommissionId: row.originalCommissionId,
    });
  private statementRecord = (row: {
    id: string;
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
    timezone: string;
    status: 'draft' | 'finalized';
    grossEarnedIqd: number;
    reversalsIqd: number;
    netCommissionIqd: number;
    qualifyingCount: number;
    reversalCount: number;
    version: number;
    finalizedAt: Date | null;
    lines?: readonly {
      id: string;
      clinicId: string;
      appointmentId: string;
      appointmentReference: string;
      recognizedAt: Date;
      status: 'earned' | 'reversed';
      amountIqd: number;
      netAmountIqd: number;
      currency: string;
    }[];
    clinicBreakdowns?: readonly {
      clinicId: string;
      grossEarnedIqd: number;
      reversalsIqd: number;
      netCommissionIqd: number;
      qualifyingCount: number;
      reversalCount: number;
    }[];
  }) =>
    Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      timezone: row.timezone,
      status: row.status,
      grossEarnedIqd: row.grossEarnedIqd,
      reversalsIqd: row.reversalsIqd,
      netCommissionIqd: row.netCommissionIqd,
      qualifyingCount: row.qualifyingCount,
      reversalCount: row.reversalCount,
      version: row.version,
      finalizedAt: row.finalizedAt?.toISOString() ?? null,
      ...(row.lines
        ? {
            lines: row.lines.map((line) => ({
              ...line,
              recognizedAt: line.recognizedAt.toISOString(),
            })),
            clinicBreakdowns: row.clinicBreakdowns ?? [],
          }
        : {}),
    });
}
