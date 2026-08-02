import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { keyedHash, safeEqualHex } from '../../identity/domain/security';
import {
  PATIENT_REPOSITORY,
  type PatientDirectoryAccess,
  type PatientDirectoryCursorProjection,
  type PatientDirectoryDetailProjection,
  type PatientDirectoryQuery,
  type PatientDirectorySearchPage,
  type PatientRepository,
  type ProfileRecord,
} from '../domain/patient.repository';
import { PatientAuditPersistenceError } from '../domain/patient.errors';
import {
  apiRelationship,
  type PatientAccountProjection,
  type PatientProfileProjection,
} from '../domain/patient-profile';

export interface PatientMutationInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: string;
  readonly gender: 'female' | 'male' | 'unspecified';
}

@Injectable()
export class PatientService {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly repository: PatientRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  async me(userId: string): Promise<PatientAccountProjection> {
    const account = await this.account(userId);
    const profiles = await this.repository.profiles(account.id);
    const active =
      profiles.find((profile) => profile.id === account.activeProfileId) ??
      null;
    return Object.freeze({
      id: account.id,
      activeProfileId: active?.id ?? null,
      activeProfile: active ? this.project(active) : null,
      profileCount: profiles.length,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    });
  }

  async list(userId: string): Promise<readonly PatientProfileProjection[]> {
    const account = await this.account(userId);
    return Object.freeze(
      (await this.repository.profiles(account.id)).map((item) =>
        this.project(item),
      ),
    );
  }

  async get(
    userId: string,
    profileId: string,
  ): Promise<PatientProfileProjection> {
    const account = await this.account(userId);
    const profile = await this.repository.profile(account.id, profileId);
    if (!profile) throw new NotFoundException('Patient profile was not found.');
    return this.project(profile);
  }

  async searchDirectory(
    access: PatientDirectoryAccess,
    input: PatientDirectoryQuery,
    requestId: string,
  ): Promise<PatientDirectorySearchPage> {
    this.requireStaffAccess(access);
    const q = input.q.trim();
    if (q.length < 2 || q.length > 100)
      throw new BadRequestException(
        'Patient directory search query must be between 2 and 100 characters.',
      );
    if (
      !Number.isInteger(input.pageSize) ||
      input.pageSize < 1 ||
      input.pageSize > 25
    )
      throw new BadRequestException(
        'Patient directory page size must be between 1 and 25.',
      );
    let cursor: PatientDirectoryCursorProjection | undefined;
    if (input.cursor) {
      cursor = this.decodeCursor(input.cursor, access, q, input.pageSize);
    }
    try {
      const page = await this.repository.searchDirectory(
        access,
        {
          q,
          pageSize: input.pageSize,
        },
        cursor,
        requestId,
      );
      return Object.freeze({
        items: Object.freeze(page.items),
        nextCursor: page.nextCursor
          ? this.encodeCursor(page.nextCursor, access)
          : null,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      if (error instanceof PatientAuditPersistenceError)
        throw new ServiceUnavailableException(
          'Security audit is temporarily unavailable.',
        );
      throw error;
    }
  }

  async getDirectoryProfile(
    access: PatientDirectoryAccess,
    profileId: string,
    requestId: string,
  ): Promise<PatientDirectoryDetailProjection> {
    this.requireStaffAccess(access);
    try {
      const profile = await this.repository.getDirectoryProfile(
        access,
        profileId,
        requestId,
      );
      if (!profile)
        throw new NotFoundException('Patient profile was not found.');
      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof PatientAuditPersistenceError)
        throw new ServiceUnavailableException(
          'Security audit is temporarily unavailable.',
        );
      throw error;
    }
  }

  async create(
    userId: string,
    input: PatientMutationInput & { relationship: string },
    requestId: string,
  ) {
    const account = await this.account(userId);
    const existing = await this.repository.profiles(account.id);
    const relationship =
      input.relationship === 'me' ? 'self' : input.relationship;
    if (!existing.length && relationship !== 'self')
      throw new ConflictException('The first patient profile must be Self.');
    if (existing.length && relationship === 'self')
      throw new ConflictException('A Self profile already exists.');
    return this.project(
      await this.repository.create(
        account.id,
        {
          ...input,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          relationship,
          dateOfBirth: this.dateOfBirth(input.dateOfBirth),
        } as Parameters<PatientRepository['create']>[1],
        requestId,
        userId,
      ),
    );
  }

  async update(
    userId: string,
    profileId: string,
    input: PatientMutationInput & { version: number },
    requestId: string,
  ) {
    const account = await this.account(userId);
    const updated = await this.repository.update(
      account.id,
      profileId,
      {
        ...input,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        dateOfBirth: this.dateOfBirth(input.dateOfBirth),
      },
      input.version,
      requestId,
      userId,
    );
    if (!updated)
      throw new ConflictException(
        'Patient profile changed. Reload and try again.',
      );
    return this.project(updated);
  }

  async archive(
    userId: string,
    profileId: string,
    version: number,
    requestId: string,
  ): Promise<void> {
    const account = await this.account(userId);
    const profile = await this.repository.profile(account.id, profileId);
    if (!profile) throw new NotFoundException('Patient profile was not found.');
    if (profile.relationship === 'self')
      throw new ForbiddenException('The Self profile cannot be archived.');
    if (account.activeProfileId === profileId)
      throw new ConflictException(
        'Choose another active patient before archiving this profile.',
      );
    if (profile.status === 'inactive')
      throw new ConflictException('Patient profile is already archived.');
    if (
      !(await this.repository.archive(
        account.id,
        profileId,
        version,
        requestId,
        userId,
      ))
    )
      throw new ConflictException(
        'Patient profile changed. Reload and try again.',
      );
  }

  async activate(
    userId: string,
    profileId: string,
    requestId: string,
  ): Promise<PatientAccountProjection> {
    const account = await this.account(userId);
    const profile = await this.repository.profile(account.id, profileId);
    if (!profile) throw new NotFoundException('Patient profile was not found.');
    if (profile.status !== 'active')
      throw new ConflictException(
        'Archived patient profiles cannot be activated.',
      );
    await this.repository.activate(account.id, profileId, requestId, userId);
    return this.me(userId);
  }

  private requireStaffAccess(access: PatientDirectoryAccess): void {
    if (!access.organizationId || !access.clinicId) {
      throw new ForbiddenException('Staff tenant context is required.');
    }
  }

  private async account(userId: string) {
    const account = await this.repository.accountForUser(userId);
    if (!account)
      throw new ForbiddenException('A patient account is required.');
    return account;
  }

  private project(profile: ProfileRecord): PatientProfileProjection {
    return Object.freeze({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth.toISOString().slice(0, 10),
      gender: profile.gender,
      relationship: apiRelationship(profile.relationship),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      active: profile.status === 'active',
      version: profile.version,
    });
  }

  private encodeCursor(
    cursor: PatientDirectoryCursorProjection,
    access: PatientDirectoryAccess,
  ): string {
    const payload = Buffer.from(
      JSON.stringify({
        organizationId: access.organizationId,
        clinicId: access.clinicId,
        query: cursor.query,
        pageSize: cursor.pageSize,
        lastName: cursor.lastName,
        firstName: cursor.firstName,
        profileId: cursor.profileId,
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private decodeCursor(
    cursor: string,
    access: PatientDirectoryAccess,
    query: string,
    pageSize: number,
  ): PatientDirectoryCursorProjection {
    try {
      if (cursor.length > 2048) throw new Error('invalid');
      const [payload, signature, extra] = cursor.split('.');
      if (!payload || !signature || extra) throw new Error('invalid');
      if (!safeEqualHex(signature, this.sign(payload)))
        throw new Error('invalid');
      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as {
        organizationId?: unknown;
        clinicId?: unknown;
        query?: unknown;
        pageSize?: unknown;
        lastName?: unknown;
        firstName?: unknown;
        profileId?: unknown;
      };
      if (
        parsed.organizationId !== access.organizationId ||
        parsed.clinicId !== access.clinicId ||
        typeof parsed.query !== 'string' ||
        parsed.query !== query ||
        typeof parsed.pageSize !== 'number' ||
        !Number.isInteger(parsed.pageSize) ||
        parsed.pageSize !== pageSize ||
        parsed.pageSize < 1 ||
        parsed.pageSize > 25 ||
        typeof parsed.lastName !== 'string' ||
        typeof parsed.firstName !== 'string' ||
        typeof parsed.profileId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
          parsed.profileId,
        ) ||
        parsed.lastName.length > 100 ||
        parsed.firstName.length > 100
      )
        throw new Error('invalid');
      return {
        organizationId: access.organizationId,
        clinicId: access.clinicId,
        query: parsed.query,
        pageSize: parsed.pageSize,
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        profileId: parsed.profileId,
      };
    } catch {
      throw new BadRequestException('Patient directory cursor is invalid.');
    }
  }

  private sign(payload: string): string {
    return keyedHash(
      'patient-directory-pagination-cursor',
      payload,
      this.configuration.auditHashSecret,
    );
  }

  private dateOfBirth(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.valueOf()) ||
      date.toISOString().slice(0, 10) !== value ||
      date > new Date()
    )
      throw new BadRequestException(
        'Date of birth must be a valid date in the past.',
      );
    return date;
  }
}
