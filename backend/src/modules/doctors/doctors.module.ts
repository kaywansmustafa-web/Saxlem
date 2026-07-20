import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DoctorService } from './application/doctor.service';
import { DOCTOR_REPOSITORY } from './domain/doctor.repository';
import { PrismaDoctorRepository } from './infrastructure/prisma-doctor.repository';
import { DoctorsController } from './presentation/doctors.controller';
import { DoctorDtoMapper } from './presentation/doctor-dto.mapper';

@Module({
  imports: [IdentityModule],
  controllers: [DoctorsController],
  providers: [
    DoctorService,
    DoctorDtoMapper,
    PrismaDoctorRepository,
    { provide: DOCTOR_REPOSITORY, useExisting: PrismaDoctorRepository },
  ],
  exports: [DoctorService, DOCTOR_REPOSITORY],
})
export class DoctorsModule {}
