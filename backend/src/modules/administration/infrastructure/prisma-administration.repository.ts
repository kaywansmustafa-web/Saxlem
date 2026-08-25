import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AdministrationAccess,
  AdministrationCommand,
  AdministrationCursor,
  ClinicRecord,
  OrganizationRecord,
} from '../domain/administration';
import type { AdministrationRepository } from '../domain/administration.repository';
import { STANDARD_BILLING_PLAN_ID } from '../../billing/domain/billing';

@Injectable()
export class PrismaAdministrationRepository implements AdministrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  createOrganization(
    access: AdministrationAccess,
    name: string,
    requestId: string,
    command: AdministrationCommand,
  ) {
    return this.create(access, command, async (tx) => {
      const row = await tx.organization.create({ data: { name } });
      await tx.organizationPlanAssignment.create({
        data: {
          organizationId: row.id,
          planId: STANDARD_BILLING_PLAN_ID,
          effectiveFrom: row.createdAt,
        },
      });
      await this.events(tx, access, 'organization', row.id, null, requestId);
      return this.organizationRecord(row);
    });
  }

  async listOrganizations(pageSize: number, cursor?: AdministrationCursor) {
    const rows = await this.prisma.db.organization.findMany({
      ...(cursor
        ? {
            where: {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            },
          }
        : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    });
    const items = rows.slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(items.map((row) => this.organizationRecord(row))),
      next:
        rows.length > pageSize && items.length
          ? { createdAt: items.at(-1)!.createdAt, id: items.at(-1)!.id }
          : null,
    });
  }

  async organization(id: string) {
    const row = await this.prisma.db.organization.findUnique({ where: { id } });
    return row ? this.organizationRecord(row) : null;
  }

  createClinic(
    access: AdministrationAccess,
    input: {
      organizationId: string;
      name: string;
      code: string;
      timezone: string;
    },
    requestId: string,
    command: AdministrationCommand,
  ) {
    return this.create(access, command, async (tx) => {
      const organization = await tx.organization.findFirst({
        where: { id: input.organizationId, status: 'active' },
        select: { id: true },
      });
      if (!organization)
        throw new NotFoundException('Organization was not found.');
      const duplicate = await tx.clinic.findFirst({
        where: {
          organizationId: input.organizationId,
          code: { equals: input.code, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException(
          'Clinic code already exists in this organization.',
        );
      const row = await tx.clinic.create({ data: input });
      await this.events(
        tx,
        access,
        'clinic',
        row.id,
        row.organizationId,
        requestId,
      );
      return this.clinicRecord(row);
    });
  }

  async listClinics(
    pageSize: number,
    organizationId?: string,
    cursor?: AdministrationCursor,
  ) {
    const rows = await this.prisma.db.clinic.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    });
    const items = rows.slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(items.map((row) => this.clinicRecord(row))),
      next:
        rows.length > pageSize && items.length
          ? { createdAt: items.at(-1)!.createdAt, id: items.at(-1)!.id }
          : null,
    });
  }

  async clinic(id: string) {
    const row = await this.prisma.db.clinic.findUnique({ where: { id } });
    return row ? this.clinicRecord(row) : null;
  }

  private async create<T extends OrganizationRecord | ClinicRecord>(
    access: AdministrationAccess,
    command: AdministrationCommand,
    mutation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${access.actorId}:${command.scope}:${command.key}`}, 0))`;
        const replay = await tx.idempotencyRecord.findUnique({
          where: {
            actorId_scope_key: {
              actorId: access.actorId,
              scope: command.scope,
              key: command.key,
            },
          },
        });
        if (replay) {
          if (replay.requestHash !== command.hash)
            throw new ConflictException(
              'Idempotency key was already used for a different request.',
            );
          if (!replay.responseBody)
            throw new ConflictException(
              'Idempotent request is still being processed.',
            );
          return replay.responseBody as unknown as T;
        }
        await tx.idempotencyRecord.create({
          data: {
            actorId: access.actorId,
            scope: command.scope,
            key: command.key,
            requestHash: command.hash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
          },
        });
        const result = await mutation(tx);
        await tx.idempotencyRecord.update({
          where: {
            actorId_scope_key: {
              actorId: access.actorId,
              scope: command.scope,
              key: command.key,
            },
          },
          data: {
            responseCode: 201,
            responseBody: result as unknown as Prisma.InputJsonValue,
          },
        });
        return result;
      });
    } catch (error) {
      if (this.isUnique(error))
        throw new ConflictException(
          'Clinic code already exists in this organization.',
        );
      throw error;
    }
  }

  private events(
    tx: Prisma.TransactionClient,
    access: AdministrationAccess,
    type: 'organization' | 'clinic',
    id: string,
    organizationId: string | null,
    requestId: string,
  ) {
    const occurredAt = new Date();
    return Promise.all([
      tx.auditEvent.create({
        data: {
          organizationId,
          actorUserId: access.actorId,
          action: `${type}.created`,
          targetType: type,
          targetId: id,
          outcome: 'succeeded',
          requestId,
          occurredAt,
        },
      }),
      tx.outboxEvent.create({
        data: {
          aggregateType: type,
          aggregateId: id,
          eventType: `${type}.created`,
          payload: {
            aggregateId: id,
            ...(organizationId ? { organizationId } : {}),
          },
          occurredAt,
        },
      }),
    ]).then(() => undefined);
  }

  private organizationRecord(row: {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
  }): OrganizationRecord {
    return Object.freeze({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  private clinicRecord(row: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    timezone: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
  }): ClinicRecord {
    return Object.freeze({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  private isUnique(error: unknown): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
