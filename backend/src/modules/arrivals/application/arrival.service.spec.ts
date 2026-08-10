import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { AppointmentService } from '../../appointments/application/appointment.service';
import { ArrivalAuditPersistenceError } from '../domain/arrival.errors';
import type { ArrivalRepository } from '../domain/arrival.repository';
import { ArrivalService } from './arrival.service';

describe('ArrivalService', () => {
  const access = {
    actorId: 'patient-user',
    patient: true,
    doctor: false,
    platformAdministrator: false,
  };
  const startsAt = new Date('2026-07-21T09:00:00.000Z');

  it.each([
    ['2026-07-21T08:30:00.000Z', 'eligible', true],
    ['2026-07-21T07:59:59.999Z', 'tooEarly', false],
    ['2026-07-21T11:00:00.001Z', 'tooLate', false],
  ] as const)(
    'derives authoritative eligibility at %s',
    async (now, reason, canArrive) => {
      const { service, repository, arrival } = fixture();
      repository.get.mockResolvedValue({ ...arrival, status: 'expected' });
      const result = await service.get(
        access,
        'appointment',
        'request',
        new Date(now),
      );
      expect(result.arrivalEligibility).toEqual({
        canArrive,
        reason,
        opensAt: '2026-07-21T08:00:00.000Z',
        closesAt: '2026-07-21T11:00:00.000Z',
      });
    },
  );

  it.each([
    ['arrived', 'alreadyArrived'],
    ['queueReady', 'queueReady'],
  ] as const)('reports %s as %s', async (status, reason) => {
    const { service, repository, arrival } = fixture();
    repository.get.mockResolvedValue({ ...arrival, status });
    const result = await service.get(
      access,
      'appointment',
      'request',
      startsAt,
    );
    expect(result.arrivalEligibility).toMatchObject({
      canArrive: false,
      reason,
    });
  });

  it.each(['cancelled', 'completed', 'noShow'] as const)(
    'reports terminal %s appointments as ineligible',
    async (status) => {
      const { service, repository, arrival } = fixture({ status });
      repository.get.mockResolvedValue({ ...arrival, status: 'expected' });
      const result = await service.get(
        access,
        'appointment',
        'request',
        startsAt,
      );
      expect(result.arrivalEligibility).toMatchObject({
        canArrive: false,
        reason: 'invalidAppointmentStatus',
      });
    },
  );

  it('accepts both inclusive arrival-window boundaries', async () => {
    const early = fixture();
    await early.service.record(
      access,
      'appointment',
      1,
      'arrival-key-early',
      'request',
      new Date('2026-07-21T08:00:00.000Z'),
    );
    const late = fixture();
    await late.service.record(
      access,
      'appointment',
      1,
      'arrival-key-late',
      'request',
      new Date('2026-07-21T11:00:00.000Z'),
    );
    expect(early.record).toHaveBeenCalled();
    expect(late.record).toHaveBeenCalled();
  });

  it.each([
    new Date('2026-07-21T07:59:59.999Z'),
    new Date('2026-07-21T11:00:00.001Z'),
  ])('rejects times outside the arrival window', async (now) => {
    const { service, record } = fixture();
    await expect(
      service.record(
        access,
        'appointment',
        1,
        'arrival-key-window',
        'request',
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(record).not.toHaveBeenCalled();
  });

  it.each(['cancelled', 'completed', 'noShow'] as const)(
    'rejects an appointment in %s state',
    async (status) => {
      const { service } = fixture({ status });
      await expect(
        service.record(
          access,
          'appointment',
          1,
          `arrival-key-${status}`,
          'request',
          startsAt,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('requires a safe idempotency key and positive version', async () => {
    const { service } = fixture();
    await expect(
      service.record(access, 'appointment', 1, 'short', 'request', startsAt),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.record(
        access,
        'appointment',
        0,
        'arrival-key-version',
        'request',
        startsAt,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    '',
    '       ',
    'short',
    'abcdefgh, ijklmnop',
    'badini-ژ',
    'x'.repeat(129),
  ])('rejects malformed idempotency key %p', async (key) => {
    const { service } = fixture();
    await expect(
      service.record(access, 'appointment', 1, key, 'request', startsAt),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['abcdefgh', 'x'.repeat(128)])(
    'accepts idempotency key boundary length %p',
    async (key) => {
      const { service, record } = fixture();
      await service.record(access, 'appointment', 1, key, 'request', startsAt);
      expect(record).toHaveBeenCalled();
    },
  );

  it('replays before attempting a new transition', async () => {
    const { service, repository, record, arrival } = fixture();
    repository.replay.mockResolvedValue(arrival);
    await expect(
      service.record(
        access,
        'appointment',
        1,
        'arrival-key-replay',
        'request',
        startsAt,
      ),
    ).resolves.toEqual({
      ...arrival,
      arrivalEligibility: {
        canArrive: false,
        reason: 'queueReady',
        opensAt: '2026-07-21T08:00:00.000Z',
        closesAt: '2026-07-21T11:00:00.000Z',
      },
    });
    expect(record).not.toHaveBeenCalled();
  });

  it('fails closed for staff read and command audit persistence', async () => {
    const read = fixture();
    read.repository.auditView.mockRejectedValue(new Error('audit unavailable'));
    await expect(
      read.service.get(
        { ...access, patient: false, organizationId: 'org' },
        'appointment',
        'request',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    const write = fixture();
    write.repository.record.mockRejectedValue(
      new ArrivalAuditPersistenceError(),
    );
    await expect(
      write.service.record(
        access,
        'appointment',
        1,
        'arrival-key-audit',
        'request',
        startsAt,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

function fixture(options: { status?: string } = {}) {
  const appointment = {
    id: 'appointment',
    reference: 'SX-2026-000001',
    organizationId: 'org',
    clinicId: 'clinic',
    clinicName: 'Clinic',
    doctorId: 'doctor',
    doctorName: 'Doctor',
    patientProfileId: 'patient',
    patientName: 'Patient',
    type: 'initial',
    reason: 'Consultation',
    startsAt: '2026-07-21T09:00:00.000Z',
    endsAt: '2026-07-21T09:30:00.000Z',
    durationMinutes: 30,
    feeIqd: 25000,
    status: options.status ?? 'scheduled',
    cancellationReason: null,
    version: 1,
  };
  const arrival = {
    id: 'arrival',
    appointmentId: 'appointment',
    appointmentReference: appointment.reference,
    organizationId: 'org',
    clinicId: 'clinic',
    clinicName: 'Clinic',
    doctorId: 'doctor',
    doctorName: 'Doctor',
    patientProfileId: 'patient',
    patientName: 'Patient',
    appointmentStartsAt: appointment.startsAt,
    status: 'queueReady' as const,
    arrivedAt: appointment.startsAt,
    queueReadyAt: appointment.startsAt,
    version: 3,
  };
  const record: jest.MockedFunction<ArrivalRepository['record']> = jest
    .fn()
    .mockResolvedValue(arrival);
  const repository: jest.Mocked<ArrivalRepository> = {
    replay: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(arrival),
    record,
    auditView: jest.fn(),
  };
  const appointments = {
    get: jest.fn().mockResolvedValue(appointment),
  } as unknown as jest.Mocked<AppointmentService>;
  const configuration = {
    arrivalEarlyWindowMinutes: 60,
    arrivalLateWindowMinutes: 120,
  } as BackendConfiguration;
  return {
    arrival,
    repository,
    record,
    service: new ArrivalService(repository, appointments, configuration),
  };
}
