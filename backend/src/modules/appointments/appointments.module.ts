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
import { BACKEND_CONFIGURATION } from '../../config/configuration.module';
import type { BackendConfiguration } from '../../config/environment';
import { DepartureService, ROUTE_TIME } from './application/departure.service';
import {
  FallbackRouteTime,
  GoogleRouteTime,
  OsrmRouteTime,
  TomTomRouteTime,
} from './infrastructure/route-time';
@Module({
  imports: [IdentityModule, DoctorsModule],
  controllers: [AppointmentsController, BookingOptionsController],
  providers: [
    AppointmentService,
    DepartureService,
    {
      provide: ROUTE_TIME,
      inject: [BACKEND_CONFIGURATION],
      useFactory: ({ routing }: BackendConfiguration) =>
        new FallbackRouteTime(
          routing.provider === 'google'
            ? new GoogleRouteTime(routing.googleApiKey)
            : routing.provider === 'tomtom'
              ? new TomTomRouteTime(routing.tomtomApiKey)
              : routing.provider === 'osrm'
                ? new OsrmRouteTime(routing.osrmBaseUrl)
                : null,
        ),
    },
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
