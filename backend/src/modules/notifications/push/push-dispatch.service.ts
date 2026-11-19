import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { readNotificationContext } from '../../../common/notifications/patient-notifications';
import { pushMessage, type PushLocale } from './push-copy';
import type { PushGateway } from './push-gateway';

export const PUSH_GATEWAY = Symbol('PUSH_GATEWAY');

/** A push older than this is not worth waking a phone for. */
export const PUSH_FRESH_FOR_MS = 15 * 60_000;

/**
 * Sends new notification records to the recipient's phones. Best effort and
 * at most once: the cursor moves before sending, so a crash never sends the
 * same push twice; the in-app inbox stays the record of everything.
 */
@Injectable()
export class PushDispatchService {
  private readonly logger = new Logger(PushDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_GATEWAY) private readonly gateway: PushGateway | null,
  ) {}

  async dispatch(
    now = new Date(),
    batch = 200,
  ): Promise<{ scanned: number; sent: number }> {
    if (!this.gateway) return { scanned: 0, sent: 0 };
    const rows = await this.claim(now, batch);
    if (!rows.length) return { scanned: 0, sent: 0 };
    const fresh = rows.filter(
      (row) => now.getTime() - row.createdAt.getTime() <= PUSH_FRESH_FOR_MS,
    );
    const devices = fresh.length
      ? await this.prisma.db.pushDevice.findMany({
          where: {
            userId: {
              in: [...new Set(fresh.map((row) => row.recipientUserId))],
            },
          },
        })
      : [];
    const jobs: (() => Promise<{ token: string; result: string }>)[] = [];
    for (const row of fresh)
      for (const device of devices) {
        if (device.userId !== row.recipientUserId) continue;
        const text = pushMessage(
          row.type,
          row.payload,
          device.locale as PushLocale,
        );
        if (!text) continue;
        const context = readNotificationContext(row.payload);
        const data: Record<string, string> = {
          notificationId: row.id,
          type: row.type,
        };
        if (context?.appointmentId) data.appointmentId = context.appointmentId;
        if (row.patientProfileId) data.profileId = row.patientProfileId;
        jobs.push(() =>
          this.gateway!.send(device.token, {
            ...text,
            data,
            urgent: row.priority === 'high',
          }).then(
            (result) => ({ token: device.token, result }),
            () => ({ token: device.token, result: 'failed' }),
          ),
        );
      }
    const results: { token: string; result: string }[] = [];
    for (let start = 0; start < jobs.length; start += 20)
      results.push(
        ...(await Promise.all(
          jobs.slice(start, start + 20).map((job) => job()),
        )),
      );
    const invalid = results
      .filter((item) => item.result === 'invalid-token')
      .map((item) => item.token);
    if (invalid.length)
      await this.prisma.db.pushDevice.deleteMany({
        where: { token: { in: invalid } },
      });
    const failed = results.filter((item) => item.result === 'failed').length;
    if (failed) this.logger.warn({ outcomeCode: 'PUSH_SEND_FAILED', failed });
    return {
      scanned: rows.length,
      sent: results.filter((item) => item.result === 'sent').length,
    };
  }

  /** Takes the next records and moves the cursor past them. */
  private claim(now: Date, batch: number) {
    return this.prisma.db.$transaction(async (tx) => {
      const cursor = await tx.$queryRaw<{ last: bigint }[]>`
        SELECT last_sequence AS last FROM push_dispatch_cursor WHERE id = 1 FOR UPDATE`;
      if (!cursor.length) {
        // First run: start from here, never push the history.
        await tx.$executeRaw`
          INSERT INTO push_dispatch_cursor (id, last_sequence, updated_at)
          SELECT 1, coalesce(max(delivery_sequence), 0), ${now}
          FROM notification_records
          ON CONFLICT (id) DO NOTHING`;
        return [];
      }
      const rows = await tx.notificationRecord.findMany({
        where: {
          deliverySequence: { gt: cursor[0]!.last },
          // A record still being written by a slower transaction can get a
          // lower number than one already committed; a short lag lets it land.
          createdAt: { lte: new Date(now.getTime() - 2_000) },
        },
        orderBy: { deliverySequence: 'asc' },
        take: batch,
        select: {
          id: true,
          deliverySequence: true,
          recipientUserId: true,
          patientProfileId: true,
          type: true,
          priority: true,
          payload: true,
          createdAt: true,
        },
      });
      const last = rows.at(-1);
      if (last)
        await tx.pushDispatchCursor.update({
          where: { id: 1 },
          data: { lastSequence: last.deliverySequence, updatedAt: now },
        });
      return rows;
    });
  }
}
