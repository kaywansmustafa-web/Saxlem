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
});
