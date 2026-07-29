import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AccountRecord,
  PatientRepository,
  ProfileInput,
  ProfileRecord,
} from '../domain/patient.repository';

const profileInclude = { relationships: true } as const;
type PersistedProfile = Prisma.PatientProfileGetPayload<{
  include: typeof profileInclude;
}>;

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async accountForUser(userId: string): Promise<AccountRecord | null> {
    const account = await this.prisma.db.patientAccount.findUnique({
      where: { userId },
      include: { activeProfile: true },
    });
    return (
      account && {
        id: account.id,
        userId: account.userId,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        activeProfileId: account.activeProfile?.patientProfileId ?? null,
      }
    );
  }

  async profiles(accountId: string): Promise<readonly ProfileRecord[]> {
    return (
      await this.prisma.db.patientProfile.findMany({
        where: { patientAccountId: accountId },
        include: profileInclude,
        orderBy: { createdAt: 'asc' },
      })
    ).map((profile) => this.map(profile));
  }

  async profile(
    accountId: string,
    profileId: string,
  ): Promise<ProfileRecord | null> {
    const profile = await this.prisma.db.patientProfile.findFirst({
      where: { id: profileId, patientAccountId: accountId },
      include: profileInclude,
    });
    return profile ? this.map(profile) : null;
  }

  async create(
    accountId: string,
    input: ProfileInput,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord> {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const created = await tx.patientProfile.create({
          data: {
            patientAccountId: accountId,
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
          },
        });
        await tx.familyRelationship.create({
          data: {
            patientAccountId: accountId,
            patientProfileId: created.id,
            relationship: input.relationship,
          },
        });
        const profile = await tx.patientProfile.findUniqueOrThrow({
          where: { id: created.id },
          include: profileInclude,
        });
        if (input.relationship === 'self')
          await tx.patientAccountActiveProfile.create({
            data: { patientAccountId: accountId, patientProfileId: profile.id },
          });
        await this.audit(
          tx,
          actorId,
          'patient.profile.created',
          profile.id,
          requestId,
        );
        return this.map(profile);
      });
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException('A Self profile already exists.');
      throw error;
    }
  }

  async update(
    accountId: string,
    profileId: string,
    input: Omit<ProfileInput, 'relationship'>,
    version: number,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord | null> {
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "patient_profiles"
        WHERE "id" = ${profileId}::uuid FOR UPDATE`;
      const activeQueueEntry = await tx.queueEntry.findFirst({
        where: {
          patientProfileId: profileId,
          status: { in: ['waiting', 'called', 'inConsultation'] },
        },
        select: { id: true },
      });
      if (activeQueueEntry) return null;
      const result = await tx.patientProfile.updateMany({
        where: {
          id: profileId,
          patientAccountId: accountId,
          version,
          status: 'active',
        },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          version: { increment: 1 },
        },
      });
      if (!result.count) return null;
      const profile = await tx.patientProfile.findUniqueOrThrow({
        where: { id: profileId },
        include: profileInclude,
      });
      await this.audit(
        tx,
        actorId,
        'patient.profile.updated',
        profileId,
        requestId,
      );
      return this.map(profile);
    });
  }

  async archive(
    accountId: string,
    profileId: string,
    version: number,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord | null> {
    return this.prisma.db.$transaction(async (tx) => {
      const result = await tx.patientProfile.updateMany({
        where: {
          id: profileId,
          patientAccountId: accountId,
          version,
          status: 'active',
          relationships: { none: { relationship: 'self' } },
        },
        data: { status: 'inactive', version: { increment: 1 } },
      });
      if (!result.count) return null;
      const profile = await tx.patientProfile.findUniqueOrThrow({
        where: { id: profileId },
        include: profileInclude,
      });
      await this.audit(
        tx,
        actorId,
        'patient.profile.archived',
        profileId,
        requestId,
      );
      return this.map(profile);
    });
  }

  async activate(
    accountId: string,
    profileId: string,
    requestId: string,
    actorId: string,
  ): Promise<void> {
    await this.prisma.db.$transaction(async (tx) => {
      const eligible = await tx.patientProfile.count({
        where: { id: profileId, patientAccountId: accountId, status: 'active' },
      });
      if (!eligible)
        throw new ConflictException(
          'Archived patient profiles cannot be activated.',
        );
      await tx.patientAccountActiveProfile.upsert({
        where: { patientAccountId: accountId },
        create: { patientAccountId: accountId, patientProfileId: profileId },
        update: { patientProfileId: profileId },
      });
      await this.audit(
        tx,
        actorId,
        'patient.active-profile.changed',
        profileId,
        requestId,
      );
    });
  }

  private map(profile: PersistedProfile): ProfileRecord {
    const relationship = profile.relationships[0]?.relationship;
    if (!relationship)
      throw new Error('Patient profile relationship invariant is broken.');
    return {
      id: profile.id,
      patientAccountId: profile.patientAccountId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      relationship,
      status: profile.status,
      version: profile.version,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    action: string,
    targetId: string,
    requestId: string,
  ) {
    return tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        action,
        targetType: 'PatientProfile',
        targetId,
        outcome: 'succeeded',
        requestId,
        occurredAt: new Date(),
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
