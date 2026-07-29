import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AppointmentQueueCompletionPort,
  CompleteAppointmentFromQueueInput,
} from '../domain/appointment-queue-completion.port';
import { AppointmentAuditPersistenceError } from '../domain/appointment.errors';

@Injectable()
export class PrismaAppointmentQueueCompletionPort implements AppointmentQueueCompletionPort {
  async completeFromQueue(
    tx: Prisma.TransactionClient,
    input: CompleteAppointmentFromQueueInput,
  ): Promise<void> {
    const appointment = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
    });
    if (
      !appointment ||
      !['scheduled', 'confirmed'].includes(appointment.status)
    )
      throw new ConflictException('Appointment cannot be completed.');
    const changed = await tx.appointment.updateMany({
      where: {
        id: input.appointmentId,
        version: input.expectedVersion,
        status: { in: ['scheduled', 'confirmed'] },
      },
      data: {
        status: 'completed',
        version: { increment: 1 },
      },
    });
    if (changed.count !== 1)
      throw new ConflictException('Appointment version is stale.');
    try {
      await tx.appointmentEvent.create({
        data: {
          organizationId: appointment.organizationId,
          appointmentId: appointment.id,
          type: 'appointment.completedFromQueue',
          payload: {
            previousStatus: appointment.status,
            queueSessionId: input.queueSessionId,
            queueEntryId: input.queueEntryId,
          },
          occurredAt: input.occurredAt,
        },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: appointment.organizationId,
          clinicId: appointment.clinicId,
          actorUserId: input.actorUserId,
          action: 'appointment.completedFromQueue',
          targetType: 'Appointment',
          targetId: appointment.id,
          outcome: 'succeeded',
          requestId: input.requestId,
          metadata: { previousStatus: appointment.status },
          occurredAt: input.occurredAt,
        },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Appointment',
          aggregateId: appointment.id,
          eventType: 'appointment.completedFromQueue',
          payload: {
            organizationId: appointment.organizationId,
            clinicId: appointment.clinicId,
            appointmentId: appointment.id,
          },
          occurredAt: input.occurredAt,
        },
      });
    } catch {
      throw new AppointmentAuditPersistenceError();
    }
  }
}
