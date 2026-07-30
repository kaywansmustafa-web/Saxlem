import {
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import type { NotificationAccess } from '../domain/notification';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import { mapNotification } from '../presentation/notification-dto.mapper';

@Injectable()
export class NotificationStreamService {
  private readonly logger = new Logger(NotificationStreamService.name);
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  async open(
    access: NotificationAccess,
    initialAfter: bigint | null,
    response: Response,
  ): Promise<void> {
    const backlog = await this.repository.countAfter(access, initialAfter);
    if (backlog > this.configuration.notificationSseMaxReconnectBacklog)
      throw new PayloadTooLargeException(
        'Notification backlog must be recovered through the inbox API.',
      );

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();

    let after = initialAfter;
    let heartbeatAt = Date.now();
    const deadline =
      Date.now() + this.configuration.notificationSseMaxConnectionMs;
    try {
      while (!response.destroyed && Date.now() < deadline) {
        const page = await this.repository.list(
          access,
          after,
          this.configuration.notificationSsePageSize,
          false,
        );
        for (const item of page.items) {
          const writable = await this.write(
            response,
            `id: ${item.sequence.toString()}\nevent: notification\ndata: ${JSON.stringify(
              mapNotification(item),
            )}\n\n`,
            deadline,
          );
          if (!writable) break;
          after = item.sequence;
        }
        if (
          response.destroyed ||
          response.writableEnded ||
          Date.now() >= deadline
        )
          break;
        if (
          page.items.length === 0 &&
          Date.now() - heartbeatAt >=
            this.configuration.notificationSseHeartbeatIntervalMs
        ) {
          const writable = await this.write(
            response,
            ': heartbeat\n\n',
            deadline,
          );
          if (!writable) break;
          heartbeatAt = Date.now();
        }
        if (response.destroyed) break;
        await this.delay(
          this.configuration.notificationSsePollIntervalMs,
          response,
        );
      }
    } catch {
      this.logger.warn({ outcomeCode: 'STREAM_READ_FAILED' });
    }
    if (!response.destroyed) response.end();
  }

  private async write(
    response: Response,
    chunk: string,
    deadline: number,
  ): Promise<boolean> {
    if (response.destroyed || response.writableEnded || Date.now() >= deadline)
      return false;
    if (response.write(chunk)) return true;
    return new Promise((resolve) => {
      const remaining = Math.max(0, deadline - Date.now());
      const finish = (writable: boolean) => {
        clearTimeout(timer);
        response.off('drain', onDrain);
        response.off('close', onClose);
        resolve(writable);
      };
      const onDrain = () =>
        finish(
          !response.destroyed &&
            !response.writableEnded &&
            Date.now() < deadline,
        );
      const onClose = () => finish(false);
      const timer = setTimeout(() => finish(false), remaining);
      response.once('drain', onDrain);
      response.once('close', onClose);
    });
  }

  private delay(milliseconds: number, response: Response): Promise<void> {
    return new Promise((resolve) => {
      const onClose = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        response.off('close', onClose);
        resolve();
      }, milliseconds);
      response.once('close', onClose);
    });
  }
}
