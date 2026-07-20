import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';

@Module({})
export class OrganizationsModule {}
@Module({})
export class ClinicsModule {}
@Module({})
export class ClinicStaffModule {}
@Module({})
@Module({})
@Module({})
export class AppointmentsModule {}
@Module({})
export class DoctorAvailabilityModule {}
@Module({})
export class QueueSessionsModule {}
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
    DoctorAvailabilityModule,
    QueueSessionsModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class FoundationModules {}
