import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { IdentityModule } from '../identity/identity.module';
import {
  ClinicDoctorSettingsController,
  ClinicHoursController,
  ClinicOpeningHoursController,
  DoctorHoursController,
} from './doctor-hours.controller';
import { DoctorHoursService } from './doctor-hours.service';

/** Owner Portal → doctor → Hours; Clinic Portal → Doctors → a doctor. */
@Module({
  imports: [IdentityModule, AppointmentsModule],
  controllers: [
    DoctorHoursController,
    ClinicHoursController,
    ClinicDoctorSettingsController,
    ClinicOpeningHoursController,
  ],
  providers: [DoctorHoursService],
})
export class DoctorHoursModule {}
