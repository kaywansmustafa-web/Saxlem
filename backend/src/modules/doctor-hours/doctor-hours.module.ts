import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { IdentityModule } from '../identity/identity.module';
import {
  ClinicHoursController,
  DoctorHoursController,
} from './doctor-hours.controller';
import { DoctorHoursService } from './doctor-hours.service';

/** Owner Portal → doctor → Hours. */
@Module({
  imports: [IdentityModule, AppointmentsModule],
  controllers: [DoctorHoursController, ClinicHoursController],
  providers: [DoctorHoursService],
})
export class DoctorHoursModule {}
