import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  DoctorClinicAssignmentVisibility,
  DoctorRepository,
  DoctorSearchCriteria,
} from '../domain/doctor.repository';
import {
  doctorLanguages,
  type DoctorGender,
  type DoctorProjection,
} from '../domain/doctor';

function doctorInclude(visibility: DoctorClinicAssignmentVisibility) {
  return {
    specialtyAssignments: {
      where: { specialty: { status: 'active' as const } },
      include: { specialty: true },
      orderBy: [
        { isPrimary: 'desc' as const },
        { specialty: { displayName: 'asc' as const } },
        { specialtyId: 'asc' as const },
      ],
    },
    clinicAssignments: {
      where: {
        ...(visibility === 'active' ? { status: 'active' as const } : {}),
        clinic: { status: 'active' as const },
      },
      include: { clinic: true },
      orderBy: [
        { clinic: { name: 'asc' as const } },
        { clinicId: 'asc' as const },
      ],
    },
    availability: true,
  } as const satisfies Prisma.DoctorInclude;
}
type PersistedDoctor = Prisma.DoctorGetPayload<{
  include: ReturnType<typeof doctorInclude>;
}>;

@Injectable()
export class PrismaDoctorRepository implements DoctorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(criteria: DoctorSearchCriteria) {
    const where = this.where(criteria);
    const include = doctorInclude(criteria.clinicAssignmentVisibility);
    const [doctors, total] = await this.prisma.db.$transaction([
      this.prisma.db.doctor.findMany({
        where,
        include,
        orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        skip: (criteria.page - 1) * criteria.pageSize,
        take: criteria.pageSize,
      }),
      this.prisma.db.doctor.count({ where }),
    ]);
    return {
      items: doctors.map((doctor) =>
        this.map(doctor, criteria.clinicAssignmentVisibility),
      ),
      total,
    };
  }

  async discoveryOptions(
    criteria: Pick<
      DoctorSearchCriteria,
      'organizationId' | 'clinicId' | 'clinicAssignmentVisibility'
    >,
  ) {
    const visibleDoctor = this.visibilityWhere(criteria);
    const [doctors, specialties, clinics] = await this.prisma.db.$transaction([
      this.prisma.db.doctor.findMany({
        where: visibleDoctor,
        select: { gender: true, languages: true, yearsOfExperience: true },
      }),
      this.prisma.db.specialty.findMany({
        where: {
          status: 'active',
          doctors: { some: { doctor: visibleDoctor } },
        },
        select: { code: true, displayName: true },
      }),
      this.prisma.db.clinic.findMany({
        where: {
          status: 'active',
          ...(criteria.organizationId
            ? { organizationId: criteria.organizationId }
            : {}),
          ...(criteria.clinicId ? { id: criteria.clinicId } : {}),
          doctorAssignments: {
            some: {
              status: 'active',
              doctor: visibleDoctor,
            },
          },
        },
        select: { id: true, name: true },
      }),
    ]);
    const compare = (left: string, right: string) =>
      left < right ? -1 : left > right ? 1 : 0;
    const years = doctors.map(({ yearsOfExperience }) => yearsOfExperience);
    const uniqueSpecialties = [
      ...new Map(
        specialties.map((option) => [option.code, option] as const),
      ).values(),
    ];
    const uniqueClinics = [
      ...new Map(
        clinics.map((option) => [option.id, option] as const),
      ).values(),
    ];
    const representedLanguages = new Set(
      doctors.flatMap(({ languages }) => languages),
    );
    const representedGenders = new Set(doctors.map(({ gender }) => gender));
    const genderOrder: readonly DoctorGender[] = [
      'female',
      'male',
      'unspecified',
    ];
    return Object.freeze({
      specialties: Object.freeze(
        uniqueSpecialties
          .map((option) => Object.freeze(option))
          .sort(
            (left, right) =>
              compare(left.displayName, right.displayName) ||
              compare(left.code, right.code),
          ),
      ),
      clinics: Object.freeze(
        uniqueClinics
          .map((option) => Object.freeze(option))
          .sort(
            (left, right) =>
              compare(left.name, right.name) || compare(left.id, right.id),
          ),
      ),
      languages: Object.freeze(
        doctorLanguages
          .filter((language) => representedLanguages.has(language))
          .sort(compare),
      ),
      genders: Object.freeze(
        genderOrder.filter((gender) => representedGenders.has(gender)),
      ),
      experience: Object.freeze({
        minimum: years.length === 0 ? null : Math.min(...years),
        maximum: years.length === 0 ? null : Math.max(...years),
      }),
    });
  }

  async find(
    id: string,
    criteria: {
      organizationId?: string | undefined;
      clinicId?: string | undefined;
      visibility: 'active' | 'activeOrInactive';
      clinicAssignmentVisibility: DoctorClinicAssignmentVisibility;
    },
  ) {
    const doctor = await this.prisma.db.doctor.findFirst({
      where: {
        id,
        ...(criteria.organizationId
          ? { organizationId: criteria.organizationId }
          : {}),
        status:
          criteria.visibility === 'active'
            ? 'active'
            : { in: ['active', 'inactive'] },
        clinicAssignments: criteria.clinicId
          ? {
              some: {
                clinicId: criteria.clinicId,
                ...(criteria.clinicAssignmentVisibility === 'active'
                  ? { status: 'active' }
                  : {}),
                clinic: { status: 'active' },
              },
            }
          : {
              some: {
                ...(criteria.clinicAssignmentVisibility === 'active'
                  ? { status: 'active' }
                  : {}),
                clinic: { status: 'active' },
              },
            },
        organization: { status: 'active' },
        specialtyAssignments: { some: { specialty: { status: 'active' } } },
      },
      include: doctorInclude(criteria.clinicAssignmentVisibility),
    });
    return doctor
      ? this.map(doctor, criteria.clinicAssignmentVisibility)
      : null;
  }

  async recordView(input: {
    actorId: string;
    organizationId: string;
    clinicId?: string | undefined;
    doctorId: string;
    requestId: string;
    action:
      | 'doctor.details.viewed'
      | 'doctor.profile.viewed'
      | 'doctor.specialties.viewed';
  }): Promise<void> {
    await this.prisma.db.auditEvent.create({
      data: {
        actorUserId: input.actorId,
        organizationId: input.organizationId,
        clinicId: input.clinicId ?? null,
        action: input.action,
        targetType: 'Doctor',
        targetId: input.doctorId,
        outcome: 'succeeded',
        requestId: input.requestId,
        occurredAt: new Date(),
      },
    });
  }

  private where(criteria: DoctorSearchCriteria): Prisma.DoctorWhereInput {
    return {
      ...(criteria.organizationId
        ? { organizationId: criteria.organizationId }
        : {}),
      status: criteria.status,
      organization: { status: 'active' },
      ...(criteria.gender ? { gender: criteria.gender } : {}),
      ...(criteria.minimumYearsOfExperience === undefined
        ? {}
        : { yearsOfExperience: { gte: criteria.minimumYearsOfExperience } }),
      ...(criteria.language ? { languages: { has: criteria.language } } : {}),
      clinicAssignments: criteria.clinicId
        ? {
            some: {
              clinicId: criteria.clinicId,
              ...(criteria.clinicAssignmentVisibility === 'active'
                ? { status: 'active' }
                : {}),
              ...(criteria.organizationId
                ? { organizationId: criteria.organizationId }
                : {}),
              clinic: { status: 'active' },
            },
          }
        : {
            some: {
              ...(criteria.clinicAssignmentVisibility === 'active'
                ? { status: 'active' }
                : {}),
              clinic: { status: 'active' },
            },
          },
      specialtyAssignments: criteria.specialty
        ? {
            some: { specialty: { code: criteria.specialty, status: 'active' } },
          }
        : { some: { specialty: { status: 'active' } } },
      ...(criteria.name
        ? {
            OR: [
              {
                displayName: {
                  contains: criteria.name,
                  mode: 'insensitive' as const,
                },
              },
              {
                firstName: {
                  contains: criteria.name,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: criteria.name,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
  }

  private visibilityWhere(
    criteria: Pick<
      DoctorSearchCriteria,
      'organizationId' | 'clinicId' | 'clinicAssignmentVisibility'
    >,
  ): Prisma.DoctorWhereInput {
    return {
      ...(criteria.organizationId
        ? { organizationId: criteria.organizationId }
        : {}),
      status: 'active',
      organization: { status: 'active' },
      clinicAssignments: criteria.clinicId
        ? {
            some: {
              clinicId: criteria.clinicId,
              status: 'active',
              clinic: { status: 'active' },
            },
          }
        : {
            some: {
              status: 'active',
              clinic: { status: 'active' },
            },
          },
      specialtyAssignments: { some: { specialty: { status: 'active' } } },
    };
  }

  private map(
    doctor: PersistedDoctor,
    clinicAssignmentVisibility: DoctorClinicAssignmentVisibility,
  ): DoctorProjection {
    const visibleClinicAssignments = doctor.clinicAssignments.filter(
      (assignment) =>
        clinicAssignmentVisibility === 'activeOrInactive' ||
        assignment.status === 'active',
    );
    if (
      clinicAssignmentVisibility === 'active' &&
      visibleClinicAssignments.length === 0
    )
      throw new Error('Doctor clinic visibility invariant is broken.');
    const selectedPrimary = doctor.specialtyAssignments[0]?.specialtyId;
    const specialties = doctor.specialtyAssignments.map((assignment) =>
      Object.freeze({
        id: assignment.specialty.id,
        code: assignment.specialty.code,
        displayName: assignment.specialty.displayName,
        isPrimary: assignment.specialtyId === selectedPrimary,
      }),
    );
    const primary =
      specialties.find((specialty) => specialty.isPrimary) ?? specialties[0];
    const publiclyAvailable =
      doctor.status === 'active' && doctor.availability?.status === 'available';
    return Object.freeze({
      id: doctor.id,
      organizationId: doctor.organizationId,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      displayName: doctor.displayName,
      fullName: doctor.displayName,
      gender: doctor.gender,
      status: doctor.status === 'inactive' ? 'inactive' : 'active',
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      biography: doctor.biography,
      languages: Object.freeze([
        ...doctor.languages,
      ]) as DoctorProjection['languages'],
      profilePhotoKey: doctor.profilePhotoKey,
      profileImageUrl: null,
      specialty: primary?.displayName ?? '',
      specialties: Object.freeze(specialties),
      clinics: Object.freeze(
        visibleClinicAssignments.map((assignment) =>
          Object.freeze({
            id: assignment.clinic.id,
            name: assignment.clinic.name,
            organizationId: assignment.organizationId,
          }),
        ),
      ),
      availability: Object.freeze({
        status: publiclyAvailable ? 'available' : 'unavailable',
        acceptingNewPatients:
          publiclyAvailable &&
          (doctor.availability?.acceptingNewPatients ?? false),
        nextAvailableAt: publiclyAvailable
          ? (doctor.availability?.nextAvailableAt?.toISOString() ?? null)
          : null,
        updatedAt: doctor.availability?.updatedAt.toISOString() ?? null,
      }),
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      version: doctor.version,
    });
  }
}
