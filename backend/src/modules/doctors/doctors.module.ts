import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DoctorService } from './application/doctor.service';
import { DOCTOR_REPOSITORY } from './domain/doctor.repository';
import { PrismaDoctorRepository } from './infrastructure/prisma-doctor.repository';
import { DoctorsController } from './presentation/doctors.controller';
import { DoctorDtoMapper } from './presentation/doctor-dto.mapper';
import { DoctorScheduleService } from './application/doctor-schedule.service';
import { TimezoneService } from './application/timezone.service';
import { DOCTOR_SCHEDULE_REPOSITORY } from './domain/doctor-schedule.repository';
import { PrismaDoctorScheduleRepository } from './infrastructure/prisma-doctor-schedule.repository';
import { DoctorScheduleDtoMapper } from './presentation/doctor-schedule-dto.mapper';
import { ClinicHoursController } from './presentation/clinic-hours.controller';

@Module({
  imports: [IdentityModule],
  controllers: [DoctorsController, ClinicHoursController],
  providers: [
    DoctorService,
    DoctorDtoMapper,
    DoctorScheduleService,
    TimezoneService,
    DoctorScheduleDtoMapper,
    PrismaDoctorRepository,
    PrismaDoctorScheduleRepository,
    { provide: DOCTOR_REPOSITORY, useExisting: PrismaDoctorRepository },
    {
      provide: DOCTOR_SCHEDULE_REPOSITORY,
      useExisting: PrismaDoctorScheduleRepository,
    },
  ],
  exports: [DoctorService, DoctorScheduleService, DOCTOR_REPOSITORY],
})
export class DoctorsModule {}
