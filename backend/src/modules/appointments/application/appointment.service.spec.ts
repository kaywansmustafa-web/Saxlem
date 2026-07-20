import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { DoctorScheduleService } from '../../doctors/application/doctor-schedule.service';
import type { AppointmentRepository } from '../domain/appointment.repository';
import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  const access = {
    actorId: 'patient',
    patient: true,
    doctor: false,
    platformAdministrator: false,
  };
  const future = new Date(Date.now() + 86_400_000);
  const input = {
    organizationId: 'org',
    clinicId: 'clinic',
    doctorId: 'doctor',
    patientProfileId: 'patient',
    type: 'initial' as const,
    reason: 'Consultation',
    startsAt: future,
    durationMinutes: 30,
    feeIqd: 25000,
  };
  it('delegates effective schedule validation before creating', async () => {
    const { service, validateContext, create, assertBookable } = fixture();
    await service.create(access, input, 'request');
    expect(validateContext).toHaveBeenCalled();
    expect(assertBookable).toHaveBeenCalledWith(
      expect.anything(),
      'doctor',
      'clinic',
      future,
      new Date(future.getTime() + 1_800_000),
    );
    expect(create).toHaveBeenCalled();
  });
  it('rejects past appointments using configured tolerance', async () => {
    const { service } = fixture();
    await expect(
      service.create(
        access,
        { ...input, startsAt: new Date(Date.now() - 180_000) },
        'request',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects unsafe duration before persistence', async () => {
    const { service } = fixture();
    await expect(
      service.create(access, { ...input, durationMinutes: 0 }, 'request'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('fails closed when a mandatory staff read audit fails', async () => {
    const { service, repository } = fixture();
    repository.auditView.mockRejectedValue(new Error('offline'));
    await expect(
      service.list(
        {
          ...access,
          patient: false,
          organizationId: 'org',
          clinicId: 'clinic',
        },
        'request',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
function fixture() {
  const appointment = {
    id: 'id',
    reference: 'SX-2026-000001',
    organizationId: 'org',
    clinicId: 'clinic',
    clinicName: 'Clinic',
    doctorId: 'doctor',
    doctorName: 'Doctor',
    patientProfileId: 'patient',
    patientName: 'Patient',
    type: 'initial' as const,
    reason: 'Consultation',
    startsAt: new Date().toISOString(),
    endsAt: new Date().toISOString(),
    durationMinutes: 30,
    feeIqd: 25000,
    status: 'scheduled' as const,
    cancellationReason: null,
    version: 1,
  };
  const validateContext = jest.fn();
  const create = jest.fn().mockResolvedValue(appointment);
  const assertBookable = jest.fn();
  const repository: jest.Mocked<AppointmentRepository> = {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(appointment),
    validateContext,
    create,
    update: jest.fn(),
    cancel: jest.fn(),
    reschedule: jest.fn(),
    auditView: jest.fn(),
  };
  const schedules = {
    assertBookable,
  } as unknown as jest.Mocked<DoctorScheduleService>;
  const configuration = {
    appointmentPastToleranceMinutes: 2,
  } as BackendConfiguration;
  return {
    repository,
    validateContext,
    create,
    assertBookable,
    service: new AppointmentService(repository, schedules, configuration),
  };
}
