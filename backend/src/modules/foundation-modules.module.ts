import { Module } from '@nestjs/common';

@Module({})
export class IdentityModule {}
@Module({})
export class OrganizationsModule {}
@Module({})
export class ClinicsModule {}
@Module({})
export class ClinicStaffModule {}
@Module({})
export class DoctorsModule {}
@Module({})
export class PatientsModule {}
@Module({})
export class PatientProfilesModule {}
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
    PatientProfilesModule,
    AppointmentsModule,
    DoctorAvailabilityModule,
    QueueSessionsModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class FoundationModules {}
