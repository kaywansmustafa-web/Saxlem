import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DoctorService, type DoctorAccessContext } from './doctor.service';
import type { DoctorRepository } from '../domain/doctor.repository';
import type { DoctorProjection } from '../domain/doctor';

const doctor: DoctorProjection = {
  id: 'doctor',
  organizationId: 'org',
  firstName: 'Shilan',
  lastName: 'Ahmed',
  displayName: 'Dr. Shilan Ahmed',
  fullName: 'Dr. Shilan Ahmed',
  gender: 'female',
  status: 'active',
  licenseNumber: 'KRI-1234',
  yearsOfExperience: 12,
  biography: '',
  languages: ['badiniKurdish'],
  profilePhotoKey: null,
  profileImageUrl: null,
  specialty: 'Cardiology',
  specialties: [],
  clinics: [],
  availability: {
    status: 'available',
    acceptingNewPatients: true,
    nextAvailableAt: null,
    updatedAt: null,
  },
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  version: 1,
};
const patient: DoctorAccessContext = {
  actorId: 'patient',
  patient: true,
  platformAdministrator: false,
};
const staff: DoctorAccessContext = {
  actorId: 'staff',
  patient: false,
  platformAdministrator: false,
  organizationId: 'org',
  clinicId: 'clinic',
};

function repository(): jest.Mocked<DoctorRepository> {
  return {
    search: jest.fn().mockResolvedValue({ items: [doctor], total: 1 }),
    find: jest.fn().mockResolvedValue(doctor),
    recordView: jest.fn().mockResolvedValue(undefined),
  };
}

describe('DoctorService', () => {
  it('forces public patient searches to active doctors and calculates pagination', async () => {
    const repo = repository();
    const page = await new DoctorService(repo).search(patient, {
      page: 2,
      pageSize: 10,
    });
    expect(repo.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ status: 'active', organizationId: undefined }),
    );
    expect(page).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('does not expose inactive doctors to patients', async () => {
    await expect(
      new DoctorService(repository()).search(patient, {
        page: 1,
        pageSize: 20,
        status: 'inactive',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('enforces the staff clinic tenant and audits staff views', async () => {
    const repo = repository();
    const service = new DoctorService(repo);
    await expect(
      service.search(staff, { page: 1, pageSize: 20, clinicId: 'other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await service.get(staff, doctor.id, 'request', 'details');
    expect(repo.recordView.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        actorId: 'staff',
        doctorId: doctor.id,
        organizationId: 'org',
        clinicId: 'clinic',
        action: 'doctor.details.viewed',
      }),
    );
  });

  it('does not audit patient views and hides invisible doctors as not found', async () => {
    const repo = repository();
    await new DoctorService(repo).get(patient, doctor.id, 'request', 'details');
    expect(repo.recordView.mock.calls).toHaveLength(0);
    repo.find.mockResolvedValue(null);
    await expect(
      new DoctorService(repo).get(patient, doctor.id, 'request', 'details'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('normalizes names and rejects unsafe pagination', async () => {
    const repo = repository();
    await new DoctorService(repo).search(patient, {
      page: 1,
      pageSize: 100,
      name: '  ژیان  ',
    });
    expect(repo.search.mock.calls[0]?.[0].name).toBe('ژیان');
    for (const page of [0, 10001, Number.MAX_SAFE_INTEGER])
      await expect(
        new DoctorService(repository()).search(patient, {
          page,
          pageSize: 20,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      new DoctorService(repository()).search(patient, {
        page: 1,
        pageSize: 20,
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an explicit retryable service failure when staff audit cannot be recorded', async () => {
    const repo = repository();
    repo.recordView.mockRejectedValue(new Error('audit unavailable'));
    await expect(
      new DoctorService(repo).get(staff, doctor.id, 'request', 'availability'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
