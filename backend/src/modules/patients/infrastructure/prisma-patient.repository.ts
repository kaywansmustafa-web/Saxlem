import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type RecordStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  ClinicPatientInput,
  ClinicPatientRegistration,
  AccountRecord,
  PatientDirectoryAccess,
  PatientDirectoryCursorProjection,
  PatientDirectoryDetailProjection,
  PatientDirectoryQuery,
  PatientDirectoryRepositoryPage,
  PatientRepository,
  ProfileInput,
  ProfileRecord,
} from '../domain/patient.repository';
import { PatientAuditPersistenceError } from '../domain/patient.errors';

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

  async closeAccount(
    accountId: string,
    userId: string,
    requestId: string,
    now: Date,
  ): Promise<{ closed: true } | { closed: false; upcoming: number }> {
    return this.prisma.db.$transaction(async (tx) => {
      const profileIds = (
        await tx.patientProfile.findMany({
          where: { patientAccountId: accountId },
          select: { id: true },
        })
      ).map((profile) => profile.id);
      const upcoming = await tx.appointment.count({
        where: {
          patientProfileId: { in: profileIds },
          status: { in: ['scheduled', 'confirmed'] },
          startsAt: { gt: now },
        },
      });
      if (upcoming) return { closed: false as const, upcoming };
      await tx.patientProfile.updateMany({
        where: { patientAccountId: accountId, status: 'active' },
        data: { status: 'inactive', version: { increment: 1 } },
      });
      // Their reviews stay (they describe real visits) but lose the name.
      await tx.doctorReview.updateMany({
        where: { patientProfileId: { in: profileIds } },
        data: { anonymous: true, authorName: 'Saxlem patient' },
      });
      await tx.savedDoctor.deleteMany({
        where: { patientAccountId: accountId },
      });
      await tx.pushDevice.deleteMany({ where: { userId } });
      await tx.patientAccount.update({
        where: { id: accountId },
        data: { normalizedPhoneNumber: `closed:${accountId}` },
      });
      await tx.user.update({
        where: { id: userId },
        data: { status: 'inactive' },
      });
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.sessionFamily.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit(tx, userId, 'patient.account.closed', null, requestId, {
        patientAccountId: accountId,
      });
      return { closed: true as const };
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

  async registerClinicPatient(
    access: PatientDirectoryAccess,
    input: ClinicPatientInput,
    requestId: string,
  ): Promise<ClinicPatientRegistration> {
    return this.prisma.db.$transaction(async (tx) => {
      // Serialize registrations for the same phone within an organization
      // so a double-tapped "Save" cannot create two records.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${access.organizationId}:${input.phoneNumber}`}))`;
      const existing = await tx.patientProfile.findMany({
        where: {
          patientAccountId: null,
          registeredByOrganizationId: access.organizationId,
          contactPhoneNumber: input.phoneNumber,
          status: 'active',
        },
        select: { id: true, firstName: true, lastName: true },
      });
      const same = existing.find(
        (profile) =>
          profile.firstName.toLowerCase() === input.firstName.toLowerCase() &&
          profile.lastName.toLowerCase() === input.lastName.toLowerCase(),
      );
      if (same) {
        await tx.organizationPatientProfile.upsert({
          where: {
            organizationId_patientProfileId: {
              organizationId: access.organizationId,
              patientProfileId: same.id,
            },
          },
          create: {
            organizationId: access.organizationId,
            patientProfileId: same.id,
          },
          update: { status: 'active' },
        });
        return Object.freeze({
          patientProfileId: same.id,
          displayName: `${same.firstName} ${same.lastName}`.trim(),
          created: false,
        });
      }
      const profile = await tx.patientProfile.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          gender: input.gender,
          contactPhoneNumber: input.phoneNumber,
          registeredByOrganizationId: access.organizationId,
          organizationRegistrations: {
            create: { organizationId: access.organizationId },
          },
        },
        select: { id: true, firstName: true, lastName: true },
      });
      await this.audit(
        tx,
        access.actorId,
        'patient.clinic_registered',
        profile.id,
        requestId,
        { origin: 'clinic' },
        access,
      );
      return Object.freeze({
        patientProfileId: profile.id,
        displayName: `${profile.firstName} ${profile.lastName}`.trim(),
        created: true,
      });
    });
  }

  async searchDirectory(
    access: PatientDirectoryAccess,
    query: PatientDirectoryQuery,
    cursor: PatientDirectoryCursorProjection | undefined,
    requestId: string,
  ): Promise<PatientDirectoryRepositoryPage> {
    const normalizedQuery = this.normalizeSearch(query.q);
    const namePattern = `%${this.escapeLike(normalizedQuery)}%`;
    const phone = this.normalizePhone(normalizedQuery);
    const phonePattern = `%${this.escapeLike(phone)}%`;
    const identifierPattern = `${this.escapeLike(normalizedQuery)}%`;
    const search = Prisma.sql`(
      LOWER(CONCAT(pp.first_name, ' ', pp.last_name)) LIKE ${namePattern} ESCAPE '\\'
      ${phone ? Prisma.sql`OR COALESCE(pa.normalized_phone_number, pp.contact_phone_number) LIKE ${phonePattern} ESCAPE '\\'` : Prisma.empty}
      ${/^[0-9a-f-]+$/iu.test(normalizedQuery) ? Prisma.sql`OR pp.id::text LIKE ${identifierPattern} ESCAPE '\\'` : Prisma.empty}
    )`;
    const scoped = access.doctorIds?.length ? [...access.doctorIds] : null;
    const doctorJoin = scoped
      ? Prisma.sql`AND a.doctor_id = ANY(${scoped}::uuid[])`
      : Prisma.empty;
    const registeredHere = scoped
      ? Prisma.sql`(pp.registered_by_organization_id = ${access.organizationId}::uuid
          AND NOT EXISTS (
            SELECT 1 FROM appointments x
            WHERE x.patient_profile_id = pp.id
              AND x.organization_id = ${access.organizationId}::uuid
          ))`
      : Prisma.sql`pp.registered_by_organization_id = ${access.organizationId}::uuid`;
    const boundary = cursor
      ? Prisma.sql`AND (
          LOWER(pp.last_name) > ${cursor.lastName}
          OR (LOWER(pp.last_name) = ${cursor.lastName} AND LOWER(pp.first_name) > ${cursor.firstName})
          OR (LOWER(pp.last_name) = ${cursor.lastName} AND LOWER(pp.first_name) = ${cursor.firstName} AND pp.id > ${cursor.profileId}::uuid)
        )`
      : Prisma.empty;

    return this.prisma.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          first_name: string;
          last_name: string;
          status: RecordStatus;
          last_appointment_at: Date | null;
          next_appointment_at: Date | null;
        }>
      >(Prisma.sql`
        SELECT pp.id, pp.first_name, pp.last_name, pp.status,
          MAX(a.starts_at) FILTER (WHERE a.starts_at < NOW()) AS last_appointment_at,
          MIN(a.starts_at) FILTER (
            WHERE a.starts_at >= NOW() AND a.status IN ('scheduled', 'confirmed')
          ) AS next_appointment_at
        FROM patient_profiles pp
        LEFT JOIN patient_accounts pa ON pa.id = pp.patient_account_id
        LEFT JOIN users u ON u.id = pa.user_id
        INNER JOIN organization_patient_profiles opp
          ON opp.patient_profile_id = pp.id
          AND opp.organization_id = ${access.organizationId}::uuid
          AND opp.status = 'active'
        INNER JOIN organizations o
          ON o.id = opp.organization_id AND o.status = 'active'
        LEFT JOIN appointments a
          ON a.organization_id = opp.organization_id
          AND a.patient_profile_id = pp.id
          AND a.clinic_id = ${access.clinicId}::uuid
          ${doctorJoin}
        WHERE pp.status = 'active'
          AND (
            u.status = 'active'
            OR (pp.patient_account_id IS NULL AND pp.registered_by_organization_id = ${access.organizationId}::uuid)
          )
          AND (
            a.id IS NOT NULL
            OR ${registeredHere}
          )
          AND ${search}
          ${boundary}
        GROUP BY pp.id, pp.first_name, pp.last_name, pp.status
        ORDER BY LOWER(pp.last_name), LOWER(pp.first_name), pp.id
        LIMIT ${query.pageSize + 1}
      `);
      const visible = rows.slice(0, query.pageSize);
      const items = visible.map((row) => ({
        patientProfileId: row.id,
        displayName: `${row.first_name} ${row.last_name}`.trim(),
        active: row.status === 'active',
        lastAppointmentAt: row.last_appointment_at?.toISOString() ?? null,
        nextAppointmentAt: row.next_appointment_at?.toISOString() ?? null,
      }));
      const last = visible.at(-1);
      await this.audit(
        tx,
        access.actorId,
        'patient.directory.searched',
        null,
        requestId,
        {
          resultCount: items.length,
          hasNextPage: rows.length > query.pageSize,
        },
        access,
      );
      return Object.freeze({
        items: Object.freeze(items),
        nextCursor:
          rows.length > query.pageSize && last
            ? {
                organizationId: access.organizationId,
                clinicId: access.clinicId,
                query: query.q,
                pageSize: query.pageSize,
                lastName: last.last_name.toLowerCase(),
                firstName: last.first_name.toLowerCase(),
                profileId: last.id,
              }
            : null,
      });
    });
  }

  async getDirectoryProfile(
    access: PatientDirectoryAccess,
    profileId: string,
    requestId: string,
  ): Promise<PatientDirectoryDetailProjection | null> {
    return this.prisma.db.$transaction(async (tx) => {
      const currentTime = new Date();
      const mine = {
        clinicId: access.clinicId,
        ...(access.doctorIds?.length
          ? { doctorId: { in: [...access.doctorIds] } }
          : {}),
      };
      const profile = await tx.patientProfile.findFirst({
        where: {
          id: profileId,
          status: 'active',
          OR: [
            {
              patientAccount: { user: { status: 'active' } },
              organizationRegistrations: {
                some: {
                  organizationId: access.organizationId,
                  status: 'active',
                  organization: { status: 'active' },
                  appointments: { some: mine },
                },
              },
            },
            {
              patientAccountId: null,
              registeredByOrganizationId: access.organizationId,
              organizationRegistrations: {
                some: {
                  organizationId: access.organizationId,
                  status: 'active',
                  organization: { status: 'active' },
                  // A receptionist sees a clinic-registered patient once they
                  // book with one of their doctors, or while unbooked.
                  ...(access.doctorIds?.length
                    ? {
                        OR: [
                          { appointments: { some: mine } },
                          { appointments: { none: {} } },
                        ],
                      }
                    : {}),
                },
              },
            },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });
      if (!profile) return null;
      const [upcoming, recent] = await Promise.all([
        tx.appointment.findMany({
          where: {
            organizationId: access.organizationId,
            clinicId: access.clinicId,
            patientProfileId: profileId,
            ...(access.doctorIds?.length
              ? { doctorId: { in: [...access.doctorIds] } }
              : {}),
            startsAt: { gte: currentTime },
            status: { in: ['scheduled', 'confirmed'] },
          },
          select: {
            id: true,
            doctorId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            version: true,
            doctorAssignment: {
              select: { doctor: { select: { displayName: true } } },
            },
          },
          orderBy: [{ startsAt: 'asc' }],
          take: 3,
        }),
        tx.appointment.findMany({
          where: {
            organizationId: access.organizationId,
            clinicId: access.clinicId,
            patientProfileId: profileId,
            ...(access.doctorIds?.length
              ? { doctorId: { in: [...access.doctorIds] } }
              : {}),
            startsAt: { lt: currentTime },
            status: {
              in: [
                'scheduled',
                'confirmed',
                'completed',
                'cancelled',
                'noShow',
              ],
            },
          },
          select: {
            id: true,
            doctorId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            version: true,
            doctorAssignment: {
              select: { doctor: { select: { displayName: true } } },
            },
          },
          orderBy: [{ startsAt: 'desc' }],
          take: 3,
        }),
      ]);
      await this.audit(
        tx,
        access.actorId,
        'patient.directory.profile_viewed',
        profile.id,
        requestId,
        undefined,
        access,
      );
      return {
        patientProfileId: profile.id,
        displayName: `${profile.firstName} ${profile.lastName}`.trim(),
        active: profile.status === 'active',
        appointments: {
          upcoming: upcoming.map((appointment) => ({
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorAssignment.doctor.displayName,
            scheduledStartAt: appointment.startsAt.toISOString(),
            scheduledEndAt: appointment.endsAt.toISOString(),
            status: appointment.status,
            version: appointment.version,
          })),
          recent: recent.map((appointment) => ({
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorAssignment.doctor.displayName,
            scheduledStartAt: appointment.startsAt.toISOString(),
            scheduledEndAt: appointment.endsAt.toISOString(),
            status: appointment.status,
            version: appointment.version,
          })),
        },
      };
    });
  }

  private normalizeSearch(value: string): string {
    return value.normalize('NFKC').toLowerCase().trim();
  }

  private normalizePhone(value: string): string {
    return value.replace(/[^0-9+]/g, '');
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private map(profile: PersistedProfile): ProfileRecord {
    const relationship = profile.relationships[0]?.relationship;
    if (!relationship)
      throw new Error('Patient profile relationship invariant is broken.');
    // App profiles always belong to an account and carry a date of birth;
    // the database enforces this (patient_profiles_app_profile_check).
    if (!profile.patientAccountId || !profile.dateOfBirth)
      throw new Error('Patient profile account invariant is broken.');
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

  private async audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    action: string,
    targetId: string | null,
    requestId: string,
    metadata?: Prisma.InputJsonObject,
    scope?: Pick<PatientDirectoryAccess, 'organizationId' | 'clinicId'>,
  ) {
    try {
      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          organizationId: scope?.organizationId ?? null,
          clinicId: scope?.clinicId ?? null,
          action,
          targetType: 'PatientProfile',
          targetId,
          outcome: 'succeeded',
          requestId,
          metadata: metadata ?? Prisma.JsonNull,
          occurredAt: new Date(),
        },
      });
    } catch {
      throw new PatientAuditPersistenceError();
    }
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
