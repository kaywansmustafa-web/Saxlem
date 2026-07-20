import { Module } from '@nestjs/common';
import { DoctorsModule } from '../doctors/doctors.module';
import { IdentityModule } from '../identity/identity.module';
import { AppointmentService } from './application/appointment.service';
import { APPOINTMENT_REPOSITORY } from './domain/appointment.repository';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';
import { AppointmentDtoMapper } from './presentation/appointment-dto.mapper';
import { AppointmentsController } from './presentation/appointments.controller';
@Module({
  imports: [IdentityModule, DoctorsModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentService,
    AppointmentDtoMapper,
    PrismaAppointmentRepository,
    {
      provide: APPOINTMENT_REPOSITORY,
      useExisting: PrismaAppointmentRepository,
    },
  ],
})
export class AppointmentsModule {}
