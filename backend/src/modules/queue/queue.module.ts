import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { QueueService } from './application/queue.service';
import { QUEUE_REPOSITORY } from './domain/queue.repository';
import { PrismaQueueRepository } from './infrastructure/prisma-queue.repository';
import { QueueController } from './presentation/queue.controller';

@Module({
  imports: [IdentityModule, AppointmentsModule],
  controllers: [QueueController],
  providers: [
    QueueService,
    PrismaQueueRepository,
    { provide: QUEUE_REPOSITORY, useExisting: PrismaQueueRepository },
  ],
})
export class QueueModule {}
