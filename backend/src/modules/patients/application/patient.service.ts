import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
  type ProfileRecord,
} from '../domain/patient.repository';
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
