import type { BookingOptionsProjection } from '../domain/appointment';
import { BookingOptionsDtoMapper } from './booking-options-dto.mapper';

describe('BookingOptionsDtoMapper', () => {
  it('returns only the patient-safe booking allowlist', () => {
    const source: BookingOptionsProjection = {
      doctorId: '0190a3e2-7b5c-7000-8000-000000000001',
      doctorName: 'Dr Test',
      organizationId: '0190a3e2-7b5c-7000-8000-000000000002',
      clinicId: '0190a3e2-7b5c-7000-8000-000000000003',
      clinicName: 'Clinic',
      clinicTimezone: 'Asia/Baghdad',
      appointmentType: 'initial',
      durationMinutes: 30,
      feeIqd: 25000,
      currency: 'IQD',
      dateFrom: '2030-07-22',
      dateTo: '2030-07-22',
      days: [
        {
          date: '2030-07-22',
          slots: [
            {
              startsAt: '2030-07-22T05:00:00.000Z',
              endsAt: '2030-07-22T05:30:00.000Z',
              durationMinutes: 30,
            },
          ],
        },
      ],
      generatedAt: '2030-07-21T12:00:00.000Z',
    };
    const result = new BookingOptionsDtoMapper().map(source);
    expect(Object.keys(result).sort()).toEqual(
      [
        'appointmentType',
        'clinicId',
        'clinicName',
        'clinicTimezone',
        'currency',
        'dateFrom',
        'dateTo',
        'days',
        'doctorId',
        'doctorName',
        'durationMinutes',
        'feeIqd',
        'generatedAt',
        'organizationId',
      ].sort(),
    );
    expect(JSON.stringify(result)).not.toMatch(
      /break|leave|holiday|absence|reason|patient|queue|rating|review/i,
    );
  });
});
