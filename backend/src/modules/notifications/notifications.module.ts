import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { NotificationService } from './application/notification.service';
import { NotificationStreamService } from './application/notification-stream.service';
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { NotificationOutboxWorker } from './infrastructure/notification-outbox.worker';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { PatientReminderWorker } from './infrastructure/patient-reminder.worker';
import { NotificationsController } from './presentation/notifications.controller';
import { BACKEND_CONFIGURATION } from '../../config/configuration.module';
import type { BackendConfiguration } from '../../config/environment';
import {
  PUSH_GATEWAY,
  PushDispatchService,
} from './push/push-dispatch.service';
import { PushDispatchWorker } from './push/push-dispatch.worker';
import { FcmPushGateway, LogPushGateway } from './push/push-gateway';
import { PushDevicesController } from './push/push-devices.controller';
import { PushDevicesService } from './push/push-devices.service';

@Module({
  imports: [IdentityModule],
  controllers: [NotificationsController, PushDevicesController],
  providers: [
    NotificationService,
    NotificationStreamService,
    NotificationOutboxWorker,
    PatientReminderWorker,
    PushDevicesService,
    PushDispatchService,
    PushDispatchWorker,
    {
      provide: PUSH_GATEWAY,
      inject: [BACKEND_CONFIGURATION],
      useFactory: ({ push }: BackendConfiguration) =>
        push.provider === 'fcm' && push.serviceAccount
          ? new FcmPushGateway(push.serviceAccount)
          : push.provider === 'log'
            ? new LogPushGateway()
            : null,
    },
    PrismaNotificationRepository,
    {
      provide: NOTIFICATION_REPOSITORY,
      useExisting: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
