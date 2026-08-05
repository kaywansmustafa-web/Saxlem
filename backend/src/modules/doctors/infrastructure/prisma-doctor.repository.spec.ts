/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PrismaDoctorRepository } from './prisma-doctor.repository';

describe('PrismaDoctorRepository discovery readiness', () => {
  it('binds patient list and detail visibility to active clinic assignments', async () => {
    const fixture = database();
    const repository = new PrismaDoctorRepository(
      fixture.prisma as unknown as PrismaService,
    );

    await repository.search({
      status: 'active',
      page: 1,
      pageSize: 20,
      clinicId: '10000000-0000-7000-8000-000000000001',
      clinicAssignmentVisibility: 'active',
    });
    expect(fixture.doctorFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        clinicAssignments: {
          some: {
            clinicId: '10000000-0000-7000-8000-000000000001',
            status: 'active',
            clinic: { status: 'active' },
          },
        },
      },
      include: {
        clinicAssignments: {
          where: { status: 'active', clinic: { status: 'active' } },
        },
      },
    });

    await repository.find('20000000-0000-7000-8000-000000000001', {
      visibility: 'active',
      clinicAssignmentVisibility: 'active',
    });
    expect(fixture.doctorFindFirst.mock.calls[0]?.[0]).toMatchObject({
      where: {
        clinicAssignments: {
          some: { status: 'active', clinic: { status: 'active' } },
        },
      },
      include: {
        clinicAssignments: {
          where: { status: 'active', clinic: { status: 'active' } },
        },
      },
    });
  });

  it('deduplicates and deterministically orders represented safe options', async () => {
    const fixture = database({
      doctors: [
        {
          gender: 'male',
          languages: ['english', 'badiniKurdish'],
          yearsOfExperience: 15,
        },
        {
          gender: 'female',
          languages: ['english', 'arabic'],
          yearsOfExperience: 3,
        },
      ],
      specialties: [
        { code: 'zeta', displayName: 'Cardiology' },
        { code: 'alpha', displayName: 'Cardiology' },
        { code: 'alpha', displayName: 'Cardiology' },
        { code: 'neurology', displayName: 'Neurology' },
      ],
      clinics: [
        { id: '20000000-0000-7000-8000-000000000002', name: 'Z Clinic' },
        { id: '10000000-0000-7000-8000-000000000001', name: 'A Clinic' },
        { id: '10000000-0000-7000-8000-000000000001', name: 'A Clinic' },
      ],
    });
    const repository = new PrismaDoctorRepository(
      fixture.prisma as unknown as PrismaService,
    );

    await expect(
      repository.discoveryOptions({
        clinicAssignmentVisibility: 'active',
      }),
    ).resolves.toEqual({
      specialties: [
        { code: 'alpha', displayName: 'Cardiology' },
        { code: 'zeta', displayName: 'Cardiology' },
        { code: 'neurology', displayName: 'Neurology' },
      ],
      clinics: [
        { id: '10000000-0000-7000-8000-000000000001', name: 'A Clinic' },
        { id: '20000000-0000-7000-8000-000000000002', name: 'Z Clinic' },
      ],
      languages: ['arabic', 'badiniKurdish', 'english'],
      genders: ['female', 'male'],
      experience: { minimum: 3, maximum: 15 },
    });
    expect(fixture.specialtyFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        status: 'active',
        doctors: {
          some: {
            doctor: {
              status: 'active',
              clinicAssignments: { some: { status: 'active' } },
            },
          },
        },
      },
    });
    expect(fixture.clinicFindMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        status: 'active',
        doctorAssignments: {
          some: { status: 'active', doctor: { status: 'active' } },
        },
      },
    });
  });

  it('returns explicit empty options and nullable experience bounds', async () => {
    const fixture = database();
    const repository = new PrismaDoctorRepository(
      fixture.prisma as unknown as PrismaService,
    );
    await expect(
      repository.discoveryOptions({
        organizationId: '30000000-0000-7000-8000-000000000003',
        clinicId: '40000000-0000-7000-8000-000000000004',
        clinicAssignmentVisibility: 'active',
      }),
    ).resolves.toEqual({
      specialties: [],
      clinics: [],
      languages: [],
      genders: [],
      experience: { minimum: null, maximum: null },
    });
  });
});

function database(
  values: {
    doctors?: object[];
    specialties?: object[];
    clinics?: object[];
  } = {},
) {
  const doctorFindMany = jest.fn().mockResolvedValue(values.doctors ?? []);
  const doctorFindFirst = jest.fn().mockResolvedValue(null);
  const doctorCount = jest.fn().mockResolvedValue(0);
  const specialtyFindMany = jest
    .fn()
    .mockResolvedValue(values.specialties ?? []);
  const clinicFindMany = jest.fn().mockResolvedValue(values.clinics ?? []);
  const db = {
    doctor: {
      findMany: doctorFindMany,
      findFirst: doctorFindFirst,
      count: doctorCount,
    },
    specialty: { findMany: specialtyFindMany },
    clinic: { findMany: clinicFindMany },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  return {
    prisma: { db },
    doctorFindMany,
    doctorFindFirst,
    specialtyFindMany,
    clinicFindMany,
  };
}
