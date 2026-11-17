import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ReceptionAccess {
  readonly actorId: string;
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
  /** True only for the receptionist role. */
  readonly receptionist: boolean;
}

export interface ReceptionDoctor {
  readonly id: string;
  readonly displayName: string;
  readonly assigned: boolean;
}

export interface ReceptionDoctorsView {
  readonly doctors: readonly ReceptionDoctor[];
  /** False until the receptionist has chosen at least one doctor. */
  readonly configured: boolean;
}

export const MAX_RECEPTION_DOCTORS = 20;

/**
 * Most clinics give each doctor their own receptionist. A receptionist
 * therefore works for one doctor by default and can add more (covering a
 * colleague, a shared front desk). Lists, the day board, the queue and new
 * bookings follow this choice. Clinic managers and doctors are not scoped.
 */
@Injectable()
export class ReceptionDoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The doctor ids a receptionist works for, or null when the caller is not
   * scoped (not a receptionist, or a receptionist who has not chosen yet).
   */
  async scope(access: ReceptionAccess): Promise<readonly string[] | null> {
    if (!access.receptionist || !access.organizationId || !access.clinicId)
      return null;
    const rows = await this.prisma.db.receptionistDoctorAssignment.findMany({
      where: {
        organizationId: access.organizationId,
        clinicId: access.clinicId,
        userId: access.actorId,
        assignment: { status: 'active', doctor: { status: 'active' } },
      },
      select: { doctorId: true },
    });
    return rows.length ? rows.map((row) => row.doctorId) : null;
  }

  async view(access: ReceptionAccess): Promise<ReceptionDoctorsView> {
    const { organizationId, clinicId } = this.tenant(access);
    const [doctors, assigned] = await Promise.all([
      this.clinicDoctors(organizationId, clinicId),
      this.prisma.db.receptionistDoctorAssignment.findMany({
        where: { organizationId, clinicId, userId: access.actorId },
        select: { doctorId: true },
      }),
    ]);
    const mine = new Set(assigned.map((row) => row.doctorId));
    return Object.freeze({
      doctors: Object.freeze(
        doctors.map((doctor) =>
          Object.freeze({ ...doctor, assigned: mine.has(doctor.id) }),
        ),
      ),
      configured: doctors.some((doctor) => mine.has(doctor.id)),
    });
  }

  /** Replaces the receptionist's doctors. At least one is required. */
  async update(
    access: ReceptionAccess,
    doctorIds: readonly string[],
    requestId: string,
  ): Promise<ReceptionDoctorsView> {
    const { organizationId, clinicId } = this.tenant(access);
    const wanted = [...new Set(doctorIds)];
    if (wanted.length < 1 || wanted.length > MAX_RECEPTION_DOCTORS)
      throw new BadRequestException(
        `Choose between 1 and ${MAX_RECEPTION_DOCTORS} doctors.`,
      );
    await this.prisma.db.$transaction(async (tx) => {
      const valid = await tx.doctorClinicAssignment.findMany({
        where: {
          organizationId,
          clinicId,
          doctorId: { in: wanted },
          status: 'active',
          doctor: { status: 'active' },
        },
        select: { doctorId: true },
      });
      if (valid.length !== wanted.length)
        throw new BadRequestException(
          'Every doctor must be active at this clinic.',
        );
      const current = await tx.receptionistDoctorAssignment.findMany({
        where: { organizationId, clinicId, userId: access.actorId },
        select: { doctorId: true },
      });
      const before = new Set(current.map((row) => row.doctorId));
      const added = wanted.filter((id) => !before.has(id));
      const removed = [...before].filter((id) => !wanted.includes(id));
      if (!added.length && !removed.length) return;
      await tx.receptionistDoctorAssignment.deleteMany({
        where: {
          organizationId,
          clinicId,
          userId: access.actorId,
          doctorId: { in: removed },
        },
      });
      await tx.receptionistDoctorAssignment.createMany({
        data: added.map((doctorId) => ({
          organizationId,
          clinicId,
          userId: access.actorId,
          doctorId,
          createdByUserId: access.actorId,
        })),
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: access.actorId,
          organizationId,
          clinicId,
          action: 'reception.doctors_updated',
          targetType: 'User',
          targetId: access.actorId,
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
          metadata: { added, removed },
        },
      });
    });
    return this.view(access);
  }

  private async clinicDoctors(organizationId: string, clinicId: string) {
    const rows = await this.prisma.db.doctorClinicAssignment.findMany({
      where: {
        organizationId,
        clinicId,
        status: 'active',
        doctor: { status: 'active' },
      },
      select: { doctor: { select: { id: true, displayName: true } } },
      orderBy: { doctor: { displayName: 'asc' } },
    });
    return rows.map((row) => row.doctor);
  }

  private tenant(access: ReceptionAccess) {
    if (!access.receptionist || !access.organizationId || !access.clinicId)
      throw new ForbiddenException('Only receptionists choose their doctors.');
    return {
      organizationId: access.organizationId,
      clinicId: access.clinicId,
    };
  }
}
