import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';

describe('PrismaAppointmentRepository error mapping', () => {
  const repository = new PrismaAppointmentRepository({} as PrismaService);
  const mapConflict = (error: unknown) =>
    (
      repository as unknown as {
        conflict: (candidate: unknown) => void;
      }
    ).conflict(error);

  it('maps only known appointment overlap constraints to conflict', () => {
    expect(() =>
      mapConflict(new Error('appointments_doctor_no_overlap')),
    ).toThrow(ConflictException);
    expect(() =>
      mapConflict(new Error('appointments_patient_no_overlap')),
    ).toThrow(ConflictException);
  });

  it('does not convert arbitrary database-shaped errors to conflict', () => {
    expect(() => mapConflict({ code: 'P2002' })).not.toThrow();
    expect(() => mapConflict(new Error('database unavailable'))).not.toThrow();
  });
});
