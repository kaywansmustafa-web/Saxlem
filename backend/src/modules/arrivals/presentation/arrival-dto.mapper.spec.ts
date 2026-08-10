import type { ArrivalResponseProjection } from '../domain/arrival';
import { ArrivalDtoMapper } from './arrival-dto.mapper';

describe('ArrivalDtoMapper', () => {
  const projection: ArrivalResponseProjection = {
    id: '0190a3e2-7b5c-7000-8000-000000000001',
    appointmentId: '0190a3e2-7b5c-7000-8000-000000000002',
    appointmentReference: 'SX-2026-000001',
    organizationId: '0190a3e2-7b5c-7000-8000-000000000003',
    clinicId: '0190a3e2-7b5c-7000-8000-000000000004',
    clinicName: 'Clinic',
    doctorId: '0190a3e2-7b5c-7000-8000-000000000005',
    doctorName: 'Doctor',
    patientProfileId: '0190a3e2-7b5c-7000-8000-000000000006',
    patientName: 'Patient',
    appointmentStartsAt: '2026-08-10T09:00:00.000Z',
    status: 'expected',
    arrivedAt: null,
    queueReadyAt: null,
    version: 1,
    arrivalEligibility: {
      canArrive: true,
      reason: 'eligible',
      opensAt: '2026-08-10T08:00:00.000Z',
      closesAt: '2026-08-10T11:00:00.000Z',
    },
  };

  it('includes authoritative eligibility for patient responses', () => {
    expect(new ArrivalDtoMapper().map(projection, true)).toMatchObject({
      arrivalEligibility: projection.arrivalEligibility,
    });
  });

  it('preserves the established strict staff response shape', () => {
    const response = new ArrivalDtoMapper().map(projection, false);
    expect(response).not.toHaveProperty('arrivalEligibility');
    expect(Object.keys(response).sort()).toEqual(
      [
        'appointmentId',
        'appointmentReference',
        'appointmentStartsAt',
        'arrivedAt',
        'clinicId',
        'clinicName',
        'doctorId',
        'doctorName',
        'id',
        'patientName',
        'patientProfileId',
        'queueReadyAt',
        'status',
        'version',
      ].sort(),
    );
  });
});
