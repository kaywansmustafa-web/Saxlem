import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  DoctorRepository,
  DoctorSearchCriteria,
} from '../domain/doctor.repository';
import type { DoctorProjection } from '../domain/doctor';

const doctorInclude = {
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
    where: { clinic: { status: 'active' as const } },
    include: { clinic: true },
    orderBy: [
      { clinic: { name: 'asc' as const } },
      { clinicId: 'asc' as const },
    ],
  },
  availability: true,
} satisfies Prisma.DoctorInclude;
type PersistedDoctor = Prisma.DoctorGetPayload<{
  include: typeof doctorInclude;
}>;

@Injectable()
export class PrismaDoctorRepository implements DoctorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(criteria: DoctorSearchCriteria) {
    const where = this.where(criteria);
    const [doctors, total] = await this.prisma.db.$transaction([
      this.prisma.db.doctor.findMany({
        where,
        include: doctorInclude,
        orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        skip: (criteria.page - 1) * criteria.pageSize,
        take: criteria.pageSize,
      }),
      this.prisma.db.doctor.count({ where }),
    ]);
    return { items: doctors.map((doctor) => this.map(doctor)), total };
  }

  async find(
    id: string,
    criteria: {
      organizationId?: string | undefined;
      clinicId?: string | undefined;
      visibility: 'active' | 'activeOrInactive';
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
                clinic: { status: 'active' },
              },
            }
          : { some: { clinic: { status: 'active' } } },
        organization: { status: 'active' },
        specialtyAssignments: { some: { specialty: { status: 'active' } } },
      },
      include: doctorInclude,
    });
    return doctor ? this.map(doctor) : null;
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
      | 'doctor.specialties.viewed'
      | 'doctor.availability.viewed';
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
              ...(criteria.organizationId
                ? { organizationId: criteria.organizationId }
                : {}),
              clinic: { status: 'active' },
            },
          }
        : { some: { clinic: { status: 'active' } } },
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

  private map(doctor: PersistedDoctor): DoctorProjection {
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
        doctor.clinicAssignments.map((assignment) =>
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
