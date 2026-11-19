import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { PushLocale } from './push-copy';

/** Phones a person keeps signed in at once; the oldest drops off. */
export const PUSH_DEVICES_MAX = 10;

@Injectable()
export class PushDevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    userId: string,
    sessionId: string,
    input: { token: string; platform: 'android' | 'ios'; locale: PushLocale },
  ): Promise<void> {
    const session = await this.prisma.db.refreshSession.findUnique({
      where: { id: sessionId },
      select: { deviceId: true },
    });
    const now = new Date();
    await this.prisma.db.$transaction(async (tx) => {
      await tx.pushDevice.upsert({
        where: { token: input.token },
        create: {
          userId,
          token: input.token,
          platform: input.platform,
          locale: input.locale,
          deviceId: session?.deviceId ?? null,
          lastSeenAt: now,
        },
        // A token belongs to whoever signed in on that phone last.
        update: {
          userId,
          platform: input.platform,
          locale: input.locale,
          deviceId: session?.deviceId ?? null,
          lastSeenAt: now,
        },
      });
      // One token per phone: an older token from the same phone is stale.
      if (session?.deviceId)
        await tx.pushDevice.deleteMany({
          where: {
            userId,
            deviceId: session.deviceId,
            token: { not: input.token },
          },
        });
      const extra = await tx.pushDevice.findMany({
        where: { userId },
        orderBy: { lastSeenAt: 'desc' },
        skip: PUSH_DEVICES_MAX,
        select: { id: true },
      });
      if (extra.length)
        await tx.pushDevice.deleteMany({
          where: { id: { in: extra.map(({ id }) => id) } },
        });
    });
  }

  async unregister(userId: string, token: string): Promise<void> {
    await this.prisma.db.pushDevice.deleteMany({ where: { userId, token } });
  }
}
