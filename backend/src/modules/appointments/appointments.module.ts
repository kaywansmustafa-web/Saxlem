import { Module } from '@nestjs/common';
import { DoctorsModule } from '../doctors/doctors.module';
import { IdentityModule } from '../identity/identity.module';
import { AppointmentService } from './application/appointment.service';
import { APPOINTMENT_REPOSITORY } from './domain/appointment.repository';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';
import { PrismaAppointmentQueueCompletionPort } from './infrastructure/prisma-appointment-queue-completion.port';
import { APPOINTMENT_QUEUE_COMPLETION_PORT } from './domain/appointment-queue-completion.port';
import { AppointmentDtoMapper } from './presentation/appointment-dto.mapper';
import { AppointmentsController } from './presentation/appointments.controller';
import { BookingOptionsController } from './presentation/booking-options.controller';
import { BookingOptionsDtoMapper } from './presentation/booking-options-dto.mapper';
@Module({
  imports: [IdentityModule, DoctorsModule],
  controllers: [AppointmentsController, BookingOptionsController],
  providers: [
    AppointmentService,
    AppointmentDtoMapper,
    BookingOptionsDtoMapper,
    PrismaAppointmentRepository,
    {
      provide: APPOINTMENT_REPOSITORY,
      useExisting: PrismaAppointmentRepository,
    },
    PrismaAppointmentQueueCompletionPort,
    {
      provide: APPOINTMENT_QUEUE_COMPLETION_PORT,
      useExisting: PrismaAppointmentQueueCompletionPort,
    },
  ],
  exports: [AppointmentService, APPOINTMENT_QUEUE_COMPLETION_PORT],
})
export class AppointmentsModule {}
