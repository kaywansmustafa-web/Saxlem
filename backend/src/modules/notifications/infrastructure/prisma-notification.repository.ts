import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  NotificationAccess,
  NotificationProjection,
} from '../domain/notification';
import type { NotificationRepository } from '../domain/notification.repository';

const select = {
  id: true,
  organizationId: true,
  clinicId: true,
  patientProfileId: true,
  deliverySequence: true,
  type: true,
  priority: true,
  payload: true,
  occurredAt: true,
  createdAt: true,
  readAt: true,
} as const;

type Row = Prisma.NotificationRecordGetPayload<{ select: typeof select }>;

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    access: NotificationAccess,
    after: bigint | null,
    pageSize: number,
    unreadOnly: boolean,
  ) {
    const rows = await this.prisma.db.notificationRecord.findMany({
      where: {
        ...this.scope(access),
        ...(after === null ? {} : { deliverySequence: { gt: after } }),
        ...(unreadOnly ? { readAt: null } : {}),
      },
      select,
      orderBy: { deliverySequence: 'asc' },
      take: pageSize + 1,
    });
    const hasNext = rows.length > pageSize;
    const items = (hasNext ? rows.slice(0, pageSize) : rows).map((row) =>
      this.map(row),
    );
    return Object.freeze({
      items: Object.freeze(items),
      nextSequence: hasNext ? items.at(-1)!.sequence : null,
    });
  }

  async markRead(
    access: NotificationAccess,
    notificationId: string,
    idempotencyKey: string,
    requestId: string,
  ) {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const scope = 'notification.mark-read';
        const requestHash = createHash('sha256')
          .update(`${scope}:${notificationId}`)
          .digest('hex');
        const replay = await tx.idempotencyRecord.findUnique({
          where: {
            actorId_scope_key: {
              actorId: access.actorId,
              scope,
              key: idempotencyKey,
            },
          },
        });
        if (replay) {
          if (replay.requestHash !== requestHash)
            throw new ConflictException(
              'Idempotency key was already used for a different request.',
            );
          const replayId = (replay.responseBody as { id?: unknown } | null)?.id;
          if (typeof replayId !== 'string') return null;
          const row = await tx.notificationRecord.findFirst({
            where: { id: replayId, ...this.scope(access) },
            select,
          });
          return row ? this.map(row) : null;
        }
        const row = await tx.notificationRecord.findFirst({
          where: { id: notificationId, ...this.scope(access) },
          select,
        });
        if (!row) return null;
        const readAt = row.readAt ?? new Date();
        if (!row.readAt) {
          await tx.$queryRaw`
            SELECT id, read_at
            FROM notification_mark_read(
              ${row.id}::uuid,
              ${access.actorId}::uuid,
              ${readAt}::timestamptz
            )
          `;
        }
        const updated = { ...row, readAt };
        await tx.auditEvent.create({
          data: {
            organizationId: row.organizationId,
            clinicId: row.clinicId,
            actorUserId: access.actorId,
            action: 'notification.marked-read',
            targetType: 'NotificationRecord',
            targetId: row.id,
            outcome: 'succeeded',
            requestId,
            metadata: { read: true },
            occurredAt: readAt,
          },
        });
        await tx.idempotencyRecord.create({
          data: {
            actorId: access.actorId,
            scope,
            key: idempotencyKey,
            requestHash,
            responseCode: 200,
            responseBody: { id: row.id },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        return this.map(updated);
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new ServiceUnavailableException(
        'Notification read state is temporarily unavailable.',
      );
    }
  }

  async sequenceIsAccessible(
    access: NotificationAccess,
    sequence: bigint,
  ): Promise<boolean> {
    return Boolean(
      await this.prisma.db.notificationRecord.findFirst({
        where: { deliverySequence: sequence, ...this.scope(access) },
        select: { id: true },
      }),
    );
  }

  countAfter(
    access: NotificationAccess,
    after: bigint | null,
  ): Promise<number> {
    return this.prisma.db.notificationRecord.count({
      where: {
        ...this.scope(access),
        ...(after === null ? {} : { deliverySequence: { gt: after } }),
      },
    });
  }

  private scope(
    access: NotificationAccess,
  ): Prisma.NotificationRecordWhereInput {
    return {
      recipientUserId: access.actorId,
      ...(access.patient
        ? {}
        : {
            organizationId: access.organizationId ?? '__missing__',
            clinicId: access.clinicId ?? '__missing__',
          }),
    };
  }

  private map(row: Row): NotificationProjection {
    const payload =
      row.payload &&
      typeof row.payload === 'object' &&
      !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};
    return Object.freeze({
      id: row.id,
      patientProfileId: row.patientProfileId,
      sequence: row.deliverySequence,
      type: row.type,
      priority: row.priority,
      actionCode:
        typeof payload.actionCode === 'string' ? payload.actionCode : row.type,
      occurredAt: row.occurredAt,
      createdAt: row.createdAt,
      readAt: row.readAt,
    });
  }
}
