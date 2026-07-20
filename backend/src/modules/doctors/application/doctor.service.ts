import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository,
  type DoctorSearchCriteria,
} from '../domain/doctor.repository';
import type { DoctorPageProjection, DoctorProjection } from '../domain/doctor';
import { maximumDoctorSearchPage } from '../domain/doctor';

export type DoctorViewSurface = 'details' | 'profile' | 'specialties';

export interface DoctorAccessContext {
  readonly actorId: string;
  readonly patient: boolean;
  readonly platformAdministrator: boolean;
  readonly doctor?: boolean;
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
}

export interface DoctorSearchInput extends Omit<
  DoctorSearchCriteria,
  'organizationId' | 'status'
> {
  readonly status?: 'active' | 'inactive';
}

@Injectable()
export class DoctorService {
  constructor(
    @Inject(DOCTOR_REPOSITORY) private readonly repository: DoctorRepository,
  ) {}

  async search(
    access: DoctorAccessContext,
    input: DoctorSearchInput,
  ): Promise<DoctorPageProjection> {
    if (
      !Number.isSafeInteger(input.page) ||
      input.page < 1 ||
      input.page > maximumDoctorSearchPage ||
      !Number.isSafeInteger(input.pageSize) ||
      input.pageSize < 1 ||
      input.pageSize > 100
    )
      throw new BadRequestException(
        'Doctor pagination is outside safe bounds.',
      );
    const normalized = {
      ...input,
      name: input.name?.trim(),
    };
    if (input.name !== undefined && !normalized.name)
      throw new BadRequestException('Doctor name search cannot be empty.');
    this.validateClinic(access, normalized.clinicId);
    const criteria = this.criteria(access, normalized);
    const result = await this.repository.search(criteria);
    return Object.freeze({
      items: Object.freeze([...result.items]),
      page: criteria.page,
      pageSize: criteria.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / criteria.pageSize),
    });
  }

  async get(
    access: DoctorAccessContext,
    doctorId: string,
    requestId: string,
    surface: DoctorViewSurface,
  ): Promise<DoctorProjection> {
    const criteria = this.criteria(access, {
      page: 1,
      pageSize: 1,
      status: 'active',
    });
    const doctor = await this.repository.find(doctorId, {
      organizationId: criteria.organizationId,
      clinicId: criteria.clinicId,
      visibility: access.patient ? 'active' : 'activeOrInactive',
    });
    if (!doctor) throw new NotFoundException('Doctor was not found.');
    if (!access.patient)
      try {
        await this.repository.recordView({
          actorId: access.actorId,
          organizationId: doctor.organizationId,
          clinicId: access.clinicId,
          doctorId,
          requestId,
          action: `doctor.${surface}.viewed`,
        });
      } catch {
        throw new ServiceUnavailableException(
          'Security audit is temporarily unavailable.',
        );
      }
    return doctor;
  }

  private criteria(
    access: DoctorAccessContext,
    input: DoctorSearchInput,
  ): DoctorSearchCriteria {
    if (
      !access.patient &&
      !access.platformAdministrator &&
      !access.organizationId
    )
      throw new ForbiddenException('Staff tenant context is required.');
    if (access.patient && input.status === 'inactive')
      throw new ForbiddenException(
        'Inactive doctors are not publicly visible.',
      );
    return {
      ...input,
      organizationId:
        access.patient || access.platformAdministrator
          ? undefined
          : access.organizationId,
      clinicId:
        access.patient || access.platformAdministrator
          ? input.clinicId
          : access.clinicId,
      status: access.patient ? 'active' : (input.status ?? 'active'),
    };
  }

  private validateClinic(
    access: DoctorAccessContext,
    requested?: string,
  ): void {
    if (
      !access.patient &&
      !access.platformAdministrator &&
      requested &&
      requested !== access.clinicId
    )
      throw new ForbiddenException(
        'Clinic filter does not match the authenticated tenant.',
      );
  }
}
