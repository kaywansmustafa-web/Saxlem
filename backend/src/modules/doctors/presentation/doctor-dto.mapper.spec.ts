import type { DoctorProjection } from '../domain/doctor';
import { DoctorDtoMapper } from './doctor-dto.mapper';

const doctor: DoctorProjection = {
  id: 'doctor',
  organizationId: 'internal-organization',
  firstName: 'Shilan',
  lastName: 'Ahmed',
  displayName: 'Dr. Shilan Ahmed',
  fullName: 'Dr. Shilan Ahmed',
  gender: 'female',
  status: 'active',
  licenseNumber: 'KRI-123',
  yearsOfExperience: 10,
  consultationFeeIqd: null,
  followUpFeeIqd: null,
  biography: 'Professional biography',
  languages: ['badiniKurdish'],
  profilePhotoKey: 'private/storage/key',
  profileImageUrl: null,
  specialty: 'Cardiology',
  specialties: [
    {
      id: 'specialty',
      code: 'cardiology',
      displayName: 'Cardiology',
      isPrimary: true,
    },
  ],
  clinics: [
    { id: 'clinic', name: 'Clinic', organizationId: 'internal-organization' },
  ],
  availability: {
    status: 'available',
    acceptingNewPatients: true,
    nextAvailableAt: null,
    updatedAt: null,
  },
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  version: 7,
};

describe('DoctorDtoMapper', () => {
  it('keeps storage keys, tenant identifiers, versions, and internal timestamps out of public DTOs', () => {
    const mapper = new DoctorDtoMapper();
    const list = mapper.page({
      items: [doctor],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    }).items[0];
    for (const value of [list, mapper.detail(doctor), mapper.profile(doctor)]) {
      const json = JSON.stringify(value);
      expect(json).not.toContain('profilePhotoKey');
      expect(json).not.toContain('private/storage/key');
      expect(json).not.toContain('organizationId');
      expect(json).not.toContain('internal-organization');
      expect(json).not.toContain('createdAt');
      expect(json).not.toContain('version');
    }
    expect(mapper.detail(doctor).profileImageUrl).toBeNull();
  });

  it('maps discovery options through an explicit patient-safe allowlist', () => {
    const value = new DoctorDtoMapper().discoveryOptions({
      specialties: [{ code: 'cardiology', displayName: 'Cardiology' }],
      clinics: [{ id: 'clinic', name: 'Clinic' }],
      languages: ['badiniKurdish'],
      genders: ['female'],
      experience: { minimum: 4, maximum: 18 },
    });
    expect(value).toEqual({
      specialties: [{ code: 'cardiology', displayName: 'Cardiology' }],
      clinics: [{ id: 'clinic', name: 'Clinic' }],
      languages: ['badiniKurdish'],
      genders: ['female'],
      experience: { minimum: 4, maximum: 18 },
    });
    for (const forbidden of [
      'organizationId',
      'profilePhotoKey',
      'licenseNumber',
      'version',
      'createdAt',
    ])
      expect(JSON.stringify(value)).not.toContain(forbidden);
  });
  it("shows the doctor's own fees, else the platform default", () => {
    const mapper = new DoctorDtoMapper({ appointmentFoundationFeeIqd: 20000 });
    expect(
      mapper.fees({ consultationFeeIqd: null, followUpFeeIqd: null }),
    ).toEqual({ firstVisitIqd: 20000, followUpIqd: 20000 });
    expect(
      mapper.fees({ consultationFeeIqd: 30000, followUpFeeIqd: null }),
    ).toEqual({ firstVisitIqd: 30000, followUpIqd: 30000 });
    expect(
      mapper.fees({ consultationFeeIqd: 30000, followUpFeeIqd: 15000 }),
    ).toEqual({ firstVisitIqd: 30000, followUpIqd: 15000 });
  });
  it('shows verified reviews as an average and a count', () => {
    const mapper = new DoctorDtoMapper();
    expect(mapper.rating({ reviewCount: 3, reviewSum: 14 })).toEqual({
      average: 4.7,
      count: 3,
    });
    expect(mapper.rating({})).toEqual({ average: 0, count: 0 });
  });
});
