import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PatientService } from './application/patient.service';
import { PATIENT_REPOSITORY } from './domain/patient.repository';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository';
import { PatientsController } from './presentation/patients.controller';

@Module({
  imports: [IdentityModule],
  controllers: [PatientsController],
  providers: [
    PatientService,
    PrismaPatientRepository,
    { provide: PATIENT_REPOSITORY, useExisting: PrismaPatientRepository },
  ],
  exports: [PatientService, PATIENT_REPOSITORY],
})
export class PatientsModule {}
