import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { keyedHash, safeEqualHex } from '../../identity/domain/security';
import type {
  NotificationAccess,
  NotificationProjection,
} from '../domain/notification';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  async list(
    access: NotificationAccess,
    cursor: string | undefined,
    pageSize: number,
    unreadOnly: boolean,
  ) {
    const after = cursor ? this.decodeCursor(cursor, access.sessionId) : null;
    const page = await this.repository.list(
      access,
      after,
      pageSize,
      unreadOnly,
    );
    return Object.freeze({
      items: page.items,
      nextCursor:
        page.nextSequence === null
          ? null
          : this.encodeCursor(page.nextSequence, access.sessionId),
    });
  }

  async markRead(
    access: NotificationAccess,
    notificationId: string,
    idempotencyKey: string,
    requestId: string,
  ): Promise<NotificationProjection> {
    if (!/^[\x21-\x7e]{8,128}$/.test(idempotencyKey))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    const result = await this.repository.markRead(
      access,
      notificationId,
      idempotencyKey,
      requestId,
    );
    if (!result) throw new NotFoundException('Notification was not found.');
    return result;
  }

  async parseLastEventId(
    access: NotificationAccess,
    value: string | undefined,
  ): Promise<bigint | null> {
    if (value === undefined || value === '') return null;
    if (!/^[1-9]\d{0,18}$/.test(value))
      throw new BadRequestException('Last-Event-ID is invalid.');
    const sequence = BigInt(value);
    if (!(await this.repository.sequenceIsAccessible(access, sequence)))
      throw new BadRequestException('Last-Event-ID is invalid.');
    return sequence;
  }

  private encodeCursor(sequence: bigint, sessionId: string): string {
    const payload = Buffer.from(
      JSON.stringify({ sessionId, sequence: sequence.toString() }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private decodeCursor(cursor: string, sessionId: string): bigint {
    try {
      const [payload, signature, extra] = cursor.split('.');
      if (!payload || !signature || extra) throw new Error('invalid');
      if (!safeEqualHex(signature, this.sign(payload)))
        throw new Error('invalid');
      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { sessionId?: unknown; sequence?: unknown };
      if (
        parsed.sessionId !== sessionId ||
        typeof parsed.sequence !== 'string' ||
        !/^[1-9]\d{0,18}$/.test(parsed.sequence)
      )
        throw new Error('invalid');
      return BigInt(parsed.sequence);
    } catch {
      throw new BadRequestException('Notification cursor is invalid.');
    }
  }

  private sign(payload: string): string {
    return keyedHash(
      'notification-pagination-cursor',
      payload,
      this.configuration.auditHashSecret,
    );
  }
}
