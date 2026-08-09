import { ForbiddenException } from '@nestjs/common';
import type { AppointmentService } from '../application/appointment.service';
import type { BookingOptionsDtoMapper } from './booking-options-dto.mapper';
import { BookingOptionsController } from './booking-options.controller';

describe('BookingOptionsController', () => {
  const projection = {
    doctorId: 'doctor',
    doctorName: 'Doctor',
    organizationId: 'organization',
    clinicId: 'clinic',
    clinicName: 'Clinic',
    clinicTimezone: 'Asia/Baghdad',
    appointmentType: 'initial' as const,
    durationMinutes: 30,
    feeIqd: 25000,
    currency: 'IQD' as const,
    dateFrom: '2030-07-22',
    dateTo: '2030-07-22',
    days: [],
    generatedAt: '2030-07-21T12:00:00.000Z',
  };
  const service = { bookingOptions: jest.fn().mockResolvedValue(projection) };
  const mapper = { map: jest.fn((value: unknown) => value) };
  const controller = new BookingOptionsController(
    service as unknown as AppointmentService,
    mapper as unknown as BookingOptionsDtoMapper,
  );
  const query = {
    clinicId: 'clinic',
    patientProfileId: 'profile',
    appointmentType: 'initial' as const,
    dateFrom: '2030-07-22',
    dateTo: '2030-07-22',
  };

  beforeEach(() => jest.clearAllMocks());

  it('passes only authenticated patient identity and query authority to the service', async () => {
    await controller.options(
      {
        principal: { id: 'patient-user', kind: 'patient' },
        requestId: 'request',
      } as never,
      { doctorId: 'doctor' },
      query,
    );
    expect(service.bookingOptions).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'patient-user', patient: true }),
      'doctor',
      'clinic',
      'profile',
      'initial',
      '2030-07-22',
      '2030-07-22',
      'request',
    );
  });

  it('rejects a non-patient even when it has the shared create capability', async () => {
    await expect(
      controller.options(
        {
          principal: { id: 'staff-user', kind: 'receptionist' },
          requestId: 'request',
        } as never,
        { doctorId: 'doctor' },
        query,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.bookingOptions).not.toHaveBeenCalled();
  });
});
