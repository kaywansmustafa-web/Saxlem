import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ArrivalsModule } from './arrivals/arrivals.module';
import { QueueModule } from './queue/queue.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdministrationModule } from './administration/administration.module';

@Module({})
export class ClinicStaffModule {}
@Module({})
@Module({})
@Module({})
export class DoctorAvailabilityModule {}
@Module({})
@Module({})
export class AuditModule {}

@Module({
  imports: [
    IdentityModule,
    AdministrationModule,
    ClinicStaffModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    ArrivalsModule,
    DoctorAvailabilityModule,
    QueueModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class FoundationModules {}
