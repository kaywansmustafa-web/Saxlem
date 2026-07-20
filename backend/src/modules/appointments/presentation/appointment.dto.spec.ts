import { validate } from 'class-validator';
import { CreateAppointmentDto } from './appointment.dto';

describe('CreateAppointmentDto', () => {
  const base = {
    organizationId: '0190a3e2-7b5c-7000-8000-000000000001',
    clinicId: '0190a3e2-7b5c-7000-8000-000000000002',
    doctorId: '0190a3e2-7b5c-7000-8000-000000000003',
    patientProfileId: '0190a3e2-7b5c-7000-8000-000000000004',
    type: 'initial',
    reason: 'Consultation',
    durationMinutes: 30,
  } as const;

  it.each([
    '2030-07-22T09:00:00Z',
    '2030-07-22T09:00:00+03:00',
    '2030-07-22T09:00:00-04:00',
  ])('accepts an explicit offset: %s', async (startsAt) => {
    expect(
      await validate(
        Object.assign(new CreateAppointmentDto(), base, { startsAt }),
      ),
    ).toHaveLength(0);
  });

  it.each(['2030-07-22', '2030-07-22T09:00:00', 'not-a-date'])(
    'rejects an ambiguous or malformed timestamp: %s',
    async (startsAt) => {
      expect(
        await validate(
          Object.assign(new CreateAppointmentDto(), base, { startsAt }),
        ),
      ).not.toHaveLength(0);
    },
  );

  it('does not expose a client-writable fee field', () => {
    expect('feeIqd' in new CreateAppointmentDto()).toBe(false);
  });
});
