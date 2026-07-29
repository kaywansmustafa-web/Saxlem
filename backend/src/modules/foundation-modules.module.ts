import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ArrivalsModule } from './arrivals/arrivals.module';
import { QueueModule } from './queue/queue.module';

@Module({})
export class OrganizationsModule {}
@Module({})
export class ClinicsModule {}
@Module({})
export class ClinicStaffModule {}
@Module({})
@Module({})
@Module({})
export class DoctorAvailabilityModule {}
@Module({})
@Module({})
export class NotificationsModule {}
@Module({})
export class AuditModule {}

@Module({
  imports: [
    IdentityModule,
    OrganizationsModule,
    ClinicsModule,
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
