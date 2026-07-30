import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { NotificationService } from './application/notification.service';
import { NotificationStreamService } from './application/notification-stream.service';
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { NotificationOutboxWorker } from './infrastructure/notification-outbox.worker';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [IdentityModule],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    NotificationStreamService,
    NotificationOutboxWorker,
    PrismaNotificationRepository,
    {
      provide: NOTIFICATION_REPOSITORY,
      useExisting: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
