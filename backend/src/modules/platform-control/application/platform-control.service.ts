import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { DocumentRecord, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { hashPassword, keyedHash } from '../../identity/domain/security';
import {
  RATE_LIMIT_BOUNDARY,
  type RateLimitBoundary,
} from '../../identity/domain/providers';
import { deriveQueueHealth } from '../../queue/domain/queue';
import {
  DOCUMENT_STORAGE,
  type DocumentStorage,
} from '../domain/document-storage';
import type {
  AuditQueryDto,
  AddStaffMembershipDto,
  CreateDocumentDto,
  CreateStaffDto,
  DoctorOnboardingDto,
  PlatformPageQueryDto,
  SearchQueryDto,
  StaffListQueryDto,
  UpdateDoctorAdminDto,
} from '../presentation/platform-control.dto';

type StaffRow = Prisma.StaffAccountGetPayload<{
  include: {
    user: {
      include: {
        roles: true;
        memberships: { include: { organization: true; clinic: true } };
      };
    };
    doctor: { select: { id: true; displayName: true } };
  };
}>;
type PatientRow = Prisma.PatientAccountGetPayload<{
  include: {
    user: { select: { status: true } };
    profiles: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

@Injectable()
export class PlatformControlService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
    @Inject(RATE_LIMIT_BOUNDARY)
    private readonly rateLimit: RateLimitBoundary,
    @Inject(DOCUMENT_STORAGE)
    private readonly documentStorage: DocumentStorage,
  ) {}

  async staff(query: StaffListQueryDto) {
    const rows = await this.prisma.db.staffAccount.findMany({
      where: {
        ...(query.search
          ? {
              email: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            }
          : {}),
        user: {
          ...(query.status ? { status: query.status } : {}),
          ...(query.role || query.organizationId || query.clinicId
            ? {
                roles: {
                  some: {
                    ...(query.role ? { role: query.role } : {}),
                    ...(query.organizationId
                      ? { organizationId: query.organizationId }
                      : {}),
                    ...(query.clinicId ? { clinicId: query.clinicId } : {}),
                  },
                },
              }
            : {}),
        },
      },
      ...(query.cursor
        ? { cursor: { id: this.uuidCursor(query.cursor) }, skip: 1 }
        : {}),
      orderBy: { id: 'asc' },
      take: query.pageSize + 1,
      include: {
        user: {
          include: {
            roles: true,
            memberships: { include: { organization: true, clinic: true } },
          },
        },
        doctor: { select: { id: true, displayName: true } },
      },
    });
    const visible = rows.slice(0, query.pageSize);
    return {
      items: visible.map((row) => this.staffRecord(row)),
      nextCursor: rows.length > query.pageSize ? visible.at(-1)!.id : null,
    };
  }

  async staffDetail(id: string) {
    const row = await this.prisma.db.staffAccount.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            roles: true,
            memberships: { include: { organization: true, clinic: true } },
          },
        },
        doctor: { select: { id: true, displayName: true } },
      },
    });
    if (!row) throw new NotFoundException('Staff account was not found.');
    return this.staffRecord(row);
  }

  async createStaff(actorId: string, input: CreateStaffDto, requestId: string) {
    const email = input.email.trim().toLowerCase();
    return this.prisma.db.$transaction(async (tx) => {
      const clinic = await tx.clinic.findFirst({
        where: {
          id: input.clinicId,
          organizationId: input.organizationId,
          status: 'active',
        },
        select: { id: true },
      });
      if (!clinic)
        throw new NotFoundException(
          'Active clinic was not found in the organization.',
        );
      if (
        await tx.staffAccount.findUnique({
          where: { email },
          select: { id: true },
        })
      )
        throw new ConflictException(
          'A staff account with this email already exists.',
        );
      const user = await tx.user.create({ data: { status: 'inactive' } });
      const account = await tx.staffAccount.create({
        data: { userId: user.id, email },
      });
      await tx.identityRoleAssignment.create({
        data: {
          userId: user.id,
          organizationId: input.organizationId,
          clinicId: input.clinicId,
          role: input.role,
        },
      });
      await tx.clinicMembership.create({
        data: {
          userId: user.id,
          organizationId: input.organizationId,
          clinicId: input.clinicId,
          role: input.role,
        },
      });
      await this.audit(
        tx,
        actorId,
        'staff.created',
        'staffAccount',
        account.id,
        requestId,
        input.organizationId,
        input.clinicId,
      );
      const activationCredential = await this.issueActivation(tx, account.id);
      return {
        ...(await this.staffDetailWithin(tx, account.id)),
        activationCredential,
        activationExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    });
  }

  async setStaffStatus(
    actorId: string,
    id: string,
    status: 'active' | 'inactive',
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const staff = await tx.staffAccount.findUnique({
        where: { id },
        include: { user: { include: { roles: true } } },
      });
      if (!staff) throw new NotFoundException('Staff account was not found.');
      if (status === 'active' && !staff.passwordHash)
        throw new ConflictException(
          'Staff must complete secure activation before the account can be activated.',
        );
      if (
        status === 'inactive' &&
        staff.user.roles.some((role) => role.role === 'platformAdministrator')
      ) {
        const count = await tx.user.count({
          where: {
            status: 'active',
            roles: { some: { role: 'platformAdministrator' } },
          },
        });
        if (count <= 1)
          throw new ConflictException(
            'The final active platform administrator cannot be deactivated.',
          );
      }
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          status,
          authorizationVersion: { increment: 1 },
          roleVersion: { increment: 1 },
        },
      });
      if (status === 'inactive') {
        const now = new Date();
        await tx.sessionFamily.updateMany({
          where: { userId: staff.userId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.refreshSession.updateMany({
          where: { userId: staff.userId, revokedAt: null },
          data: { revokedAt: now },
        });
      }
      await this.audit(
        tx,
        actorId,
        `staff.${status === 'active' ? 'activated' : 'deactivated'}`,
        'staffAccount',
        id,
        requestId,
      );
      return this.staffDetailWithin(tx, id);
    });
  }

  async addStaffMembership(
    actorId: string,
    staffAccountId: string,
    input: AddStaffMembershipDto,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const [staff, clinic] = await Promise.all([
        tx.staffAccount.findUnique({ where: { id: staffAccountId } }),
        tx.clinic.findFirst({
          where: {
            id: input.clinicId,
            organizationId: input.organizationId,
            status: 'active',
          },
        }),
      ]);
      if (!staff) throw new NotFoundException('Staff account was not found.');
      if (!clinic)
        throw new NotFoundException(
          'Active clinic was not found in the organization.',
        );
      await tx.clinicMembership.upsert({
        where: {
          organizationId_clinicId_userId_role: {
            organizationId: input.organizationId,
            clinicId: input.clinicId,
            userId: staff.userId,
            role: input.role,
          },
        },
        create: { ...input, userId: staff.userId },
        update: { status: 'active' },
      });
      await tx.identityRoleAssignment.upsert({
        where: {
          userId_organizationId_clinicId_role: {
            userId: staff.userId,
            organizationId: input.organizationId,
            clinicId: input.clinicId,
            role: input.role,
          },
        },
        create: { ...input, userId: staff.userId },
        update: {},
      });
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          authorizationVersion: { increment: 1 },
          roleVersion: { increment: 1 },
        },
      });
      await this.audit(
        tx,
        actorId,
        'staff.membership-added',
        'staffAccount',
        staffAccountId,
        requestId,
        input.organizationId,
        input.clinicId,
      );
      return this.staffDetailWithin(tx, staffAccountId);
    });
  }

  async removeStaffMembership(
    actorId: string,
    staffAccountId: string,
    membershipId: string,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const staff = await tx.staffAccount.findUnique({
        where: { id: staffAccountId },
      });
      if (!staff) throw new NotFoundException('Staff account was not found.');
      const membership = await tx.clinicMembership.findFirst({
        where: { id: membershipId, userId: staff.userId },
      });
      if (!membership)
        throw new NotFoundException('Staff membership was not found.');
      await tx.clinicMembership.update({
        where: { id: membership.id },
        data: { status: 'inactive' },
      });
      await tx.identityRoleAssignment.deleteMany({
        where: {
          userId: staff.userId,
          organizationId: membership.organizationId,
          clinicId: membership.clinicId,
          role: membership.role as never,
        },
      });
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          authorizationVersion: { increment: 1 },
          roleVersion: { increment: 1 },
        },
      });
      await this.audit(
        tx,
        actorId,
        'staff.membership-removed',
        'staffAccount',
        staffAccountId,
        requestId,
        membership.organizationId,
        membership.clinicId,
      );
      return this.staffDetailWithin(tx, staffAccountId);
    });
  }

  async patients(
    actorId: string,
    query: PlatformPageQueryDto,
    requestId: string,
  ) {
    const searchDigits = query.search?.replace(/\D/g, '') ?? '';
    // Phone lookups need at least 7 digits and match the number's ending, so a
    // short fragment cannot be used to enumerate patient phone numbers.
    const phoneSearch =
      searchDigits.length >= 7 &&
      searchDigits.length === query.search?.replace(/[\s+()-]/g, '').length;
    const rows = await this.prisma.db.patientAccount.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                ...(this.isUuid(query.search) ? [{ id: query.search }] : []),
                ...(phoneSearch
                  ? [{ normalizedPhoneNumber: { endsWith: searchDigits } }]
                  : []),
                {
                  profiles: {
                    some: {
                      OR: [
                        {
                          firstName: {
                            contains: query.search,
                            mode: 'insensitive',
                          },
                        },
                        {
                          lastName: {
                            contains: query.search,
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
        ...(query.status ? { user: { status: query.status } } : {}),
      },
      ...(query.cursor
        ? { cursor: { id: this.uuidCursor(query.cursor) }, skip: 1 }
        : {}),
      orderBy: { id: 'asc' },
      take: query.pageSize + 1,
      include: {
        user: { select: { status: true } },
        profiles: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const items = rows.slice(0, query.pageSize);
    const profileToAccount = new Map<string, string>();
    for (const row of items)
      for (const profile of row.profiles)
        profileToAccount.set(profile.id, row.id);
    const profileIds = [...profileToAccount.keys()];
    const [counts, recent] = profileIds.length
      ? await Promise.all([
          this.prisma.db.appointment.groupBy({
            by: ['patientProfileId'],
            where: { patientProfileId: { in: profileIds } },
            _count: { _all: true },
          }),
          this.prisma.db.appointment.groupBy({
            by: ['patientProfileId'],
            where: { patientProfileId: { in: profileIds } },
            _max: { startsAt: true },
          }),
        ])
      : [[], []];
    const countByAccount = new Map<string, number>();
    const recentByAccount = new Map<string, Date>();
    for (const aggregate of counts) {
      const accountId = profileToAccount.get(aggregate.patientProfileId);
      if (accountId)
        countByAccount.set(
          accountId,
          (countByAccount.get(accountId) ?? 0) + aggregate._count._all,
        );
    }
    for (const aggregate of recent) {
      const accountId = profileToAccount.get(aggregate.patientProfileId);
      const startsAt = aggregate._max.startsAt;
      const existing = accountId ? recentByAccount.get(accountId) : undefined;
      if (accountId && startsAt && (!existing || startsAt > existing))
        recentByAccount.set(accountId, startsAt);
    }
    const aggregates = items.map((row) =>
      this.patientSummary(
        row,
        countByAccount.get(row.id) ?? 0,
        recentByAccount.get(row.id) ?? null,
      ),
    );
    if (query.search)
      await this.prisma.db.auditEvent.create({
        data: {
          actorUserId: actorId,
          action: 'patient.directory-searched',
          targetType: 'patientAccount',
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
          // The search text itself is never stored: it can contain a name or phone.
          metadata: {
            searchKind: this.isUuid(query.search)
              ? 'id'
              : phoneSearch
                ? 'phone'
                : 'name',
            resultCount: aggregates.length,
          },
        },
      });
    return {
      items: aggregates,
      nextCursor: rows.length > query.pageSize ? items.at(-1)!.id : null,
    };
  }

  async patientDetail(actorId: string, id: string, requestId: string) {
    const row = await this.prisma.db.patientAccount.findUnique({
      where: { id },
      include: {
        user: { select: { status: true } },
        profiles: { include: { relationships: true } },
      },
    });
    if (!row) throw new NotFoundException('Patient account was not found.');
    const profileIds = row.profiles.map((profile) => profile.id);
    const appointments = await this.prisma.db.appointment.findMany({
      where: { patientProfileId: { in: profileIds } },
      orderBy: { startsAt: 'desc' },
      take: 50,
      select: {
        id: true,
        publicReference: true,
        patientProfileId: true,
        clinicId: true,
        startsAt: true,
        status: true,
      },
    });
    const summary = this.patientSummary(
      {
        ...row,
        profiles: row.profiles.map(({ id, firstName, lastName }) => ({
          id,
          firstName,
          lastName,
        })),
      },
      appointments.length,
      appointments[0]?.startsAt ?? null,
    );
    await this.prisma.db.auditEvent.create({
      data: {
        actorUserId: actorId,
        action: 'patient.administrative-viewed',
        targetType: 'patientAccount',
        targetId: id,
        outcome: 'succeeded',
        requestId,
        occurredAt: new Date(),
        metadata: { fields: ['identity', 'profiles', 'appointmentSummary'] },
      },
    });
    return {
      ...summary,
      profiles: row.profiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        status: profile.status,
        relationship: profile.relationships[0]?.relationship ?? 'self',
      })),
      appointments: appointments.map((appointment) => ({
        ...appointment,
        startsAt: appointment.startsAt.toISOString(),
      })),
    };
  }

  async liveOperations(query: PlatformPageQueryDto) {
    const sessions = await this.prisma.db.queueSession.findMany({
      where: {
        status: { in: ['open', 'paused'] },
        ...(query.organizationId
          ? { organizationId: query.organizationId }
          : {}),
        ...(query.clinicId ? { clinicId: query.clinicId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(query.pageSize, 100),
      include: {
        organization: { select: { name: true } },
        clinic: { select: { name: true } },
        doctorAssignment: {
          include: { doctor: { select: { displayName: true } } },
        },
        entries: {
          select: {
            status: true,
            consultationStartedAt: true,
            completedAt: true,
          },
        },
      },
    });
    // Names are loaded only for the patient currently in consultation, and only
    // to derive initials; waiting patients' identities are never read here.
    const inConsultation = sessions.length
      ? await this.prisma.db.queueEntry.findMany({
          where: {
            queueSessionId: { in: sessions.map((session) => session.id) },
            status: 'inConsultation',
          },
          select: {
            queueSessionId: true,
            patientRegistration: {
              select: {
                patientProfile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        })
      : [];
    const currentBySession = new Map(
      inConsultation.map((entry) => [
        entry.queueSessionId,
        entry.patientRegistration.patientProfile,
      ]),
    );
    return sessions.map((session) => {
      const count = (status: string) =>
        session.entries.filter((entry) => entry.status === status).length;
      const waiting = count('waiting');
      const currentProfile = currentBySession.get(session.id);
      const durations = session.entries
        .filter((entry) => entry.consultationStartedAt && entry.completedAt)
        .map(
          (entry) =>
            (entry.completedAt!.getTime() -
              entry.consultationStartedAt!.getTime()) /
            60_000,
        )
        .filter((minutes) => minutes > 0 && minutes <= 480);
      const average = durations.length
        ? durations.reduce((total, minutes) => total + minutes, 0) /
          durations.length
        : this.configuration.queueFallbackConsultationMinutes;
      const firstStartedAt = session.entries
        .map((entry) => entry.consultationStartedAt)
        .filter((date): date is Date => date !== null)
        .sort((left, right) => left.getTime() - right.getTime())[0];
      const completedCount = count('completed');
      const behindMinutes = firstStartedAt
        ? Math.max(
            0,
            (Date.now() - firstStartedAt.getTime()) / 60_000 -
              completedCount * average,
          )
        : 0;
      return {
        queueSessionId: session.id,
        organizationId: session.organizationId,
        organizationName: session.organization.name,
        clinicId: session.clinicId,
        clinicName: session.clinic.name,
        doctorId: session.doctorId,
        doctorName: session.doctorAssignment.doctor.displayName,
        operationalDate: session.operationalDate.toISOString().slice(0, 10),
        effectiveTimezone: session.effectiveTimezone,
        status: session.status,
        waitingCount: waiting,
        calledCount: count('called'),
        inConsultationCount: count('inConsultation'),
        currentPatientInitials: currentProfile
          ? `${currentProfile.firstName.slice(0, 1)}. ${currentProfile.lastName.slice(0, 1)}.`
          : null,
        estimatedDelayMinutes:
          session.status === 'paused' ? null : Math.round(behindMinutes),
        health:
          session.status === 'paused'
            ? 'paused'
            : deriveQueueHealth(behindMinutes, {
                recallGraceMinutes: this.configuration.queueRecallGraceMinutes,
                busyThresholdMinutes:
                  this.configuration.queueHealthBusyThresholdMinutes,
                delayedThresholdMinutes:
                  this.configuration.queueHealthDelayedThresholdMinutes,
                fallbackConsultationMinutes:
                  this.configuration.queueFallbackConsultationMinutes,
              }),
        updatedAt: session.updatedAt.toISOString(),
      };
    });
  }

  async analytics(from?: string, to?: string) {
    const now = new Date();
    const rangeTo = to ? new Date(to) : now;
    const rangeFrom = from
      ? new Date(from)
      : new Date(rangeTo.getTime() - 30 * 86_400_000);
    if (
      rangeFrom >= rangeTo ||
      rangeTo.getTime() - rangeFrom.getTime() > 366 * 86_400_000
    )
      throw new BadRequestException(
        'Analytics date range must be positive and no longer than 366 days.',
      );
    const baghdadNow = new Date(now.getTime() + 3 * 60 * 60_000);
    const dayStart = new Date(
      Date.UTC(
        baghdadNow.getUTCFullYear(),
        baghdadNow.getUTCMonth(),
        baghdadNow.getUTCDate(),
      ) -
        3 * 60 * 60_000,
    );
    const monthStart = new Date(
      Date.UTC(baghdadNow.getUTCFullYear(), baghdadNow.getUTCMonth(), 1) -
        3 * 60 * 60_000,
    );
    const [
      organizations,
      activeOrganizations,
      clinics,
      activeClinics,
      doctors,
      activeDoctors,
      staff,
      patients,
      appointmentsToday,
      appointmentsMonth,
      completed,
      cancelled,
      noShows,
      arrivals,
      liveQueues,
      waitingPatients,
      commissions,
      statements,
      clinicGroups,
      doctorGroups,
    ] = await Promise.all([
      this.prisma.db.organization.count(),
      this.prisma.db.organization.count({ where: { status: 'active' } }),
      this.prisma.db.clinic.count(),
      this.prisma.db.clinic.count({ where: { status: 'active' } }),
      this.prisma.db.doctor.count(),
      this.prisma.db.doctor.count({ where: { status: 'active' } }),
      this.prisma.db.staffAccount.count(),
      this.prisma.db.patientAccount.count(),
      this.prisma.db.appointment.count({
        where: {
          startsAt: {
            gte: dayStart,
            lt: new Date(dayStart.getTime() + 86_400_000),
          },
        },
      }),
      this.prisma.db.appointment.count({
        where: { startsAt: { gte: monthStart } },
      }),
      this.prisma.db.appointment.count({
        where: {
          status: 'completed',
          startsAt: { gte: rangeFrom, lt: rangeTo },
        },
      }),
      this.prisma.db.appointment.count({
        where: {
          status: 'cancelled',
          startsAt: { gte: rangeFrom, lt: rangeTo },
        },
      }),
      this.prisma.db.appointment.count({
        where: { status: 'noShow', startsAt: { gte: rangeFrom, lt: rangeTo } },
      }),
      this.prisma.db.appointmentArrival.count({
        where: { arrivedAt: { gte: rangeFrom, lt: rangeTo } },
      }),
      this.prisma.db.queueSession.count({
        where: { status: { in: ['open', 'paused'] } },
      }),
      this.prisma.db.queueEntry.count({ where: { status: 'waiting' } }),
      this.prisma.db.commissionLedgerEntry.groupBy({
        by: ['status'],
        where: { recognizedAt: { gte: monthStart } },
        _sum: { amountIqd: true },
      }),
      this.prisma.db.billingStatement.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.db.appointment.groupBy({
        by: ['clinicId'],
        where: { startsAt: { gte: rangeFrom, lt: rangeTo } },
        _count: { _all: true },
        orderBy: { _count: { clinicId: 'desc' } },
        take: 5,
      }),
      this.prisma.db.appointment.groupBy({
        by: ['doctorId'],
        where: { startsAt: { gte: rangeFrom, lt: rangeTo } },
        _count: { _all: true },
        orderBy: { _count: { doctorId: 'desc' } },
        take: 5,
      }),
    ]);
    const earned =
      commissions.find((x) => x.status === 'earned')?._sum.amountIqd ?? 0;
    const reversed = Math.abs(
      commissions.find((x) => x.status === 'reversed')?._sum.amountIqd ?? 0,
    );
    type CountBucket = { day: Date; count: bigint };
    type AmountBucket = { day: Date; amount: bigint };
    const [
      appointmentTrend,
      commissionTrend,
      patientGrowth,
      clinicGrowth,
      doctorGrowth,
      cancellationTrend,
      noShowTrend,
    ] = await Promise.all([
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("starts_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "appointments"
          WHERE "starts_at" >= ${rangeFrom} AND "starts_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<AmountBucket[]>`
          SELECT (("recognized_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COALESCE(SUM("amount_iqd"), 0)::bigint AS amount
          FROM "commission_ledger_entries"
          WHERE "recognized_at" >= ${rangeFrom} AND "recognized_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("created_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "patient_accounts"
          WHERE "created_at" >= ${rangeFrom} AND "created_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("created_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "clinics" WHERE "created_at" >= ${rangeFrom} AND "created_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("created_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "doctors" WHERE "created_at" >= ${rangeFrom} AND "created_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("starts_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "appointments" WHERE "status" = 'cancelled' AND "starts_at" >= ${rangeFrom} AND "starts_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
      this.prisma.db.$queryRaw<CountBucket[]>`
          SELECT (("starts_at" AT TIME ZONE 'Asia/Baghdad')::date)::timestamp AS day,
                 COUNT(*)::bigint AS count
          FROM "appointments" WHERE "status" = 'noShow' AND "starts_at" >= ${rangeFrom} AND "starts_at" < ${rangeTo}
          GROUP BY day ORDER BY day`,
    ]);
    const counts = (rows: CountBucket[]) =>
      rows.map((row) => ({
        day: row.day.toISOString().slice(0, 10),
        count: Number(row.count),
      }));
    const [clinicNames, doctorNames] = await Promise.all([
      this.prisma.db.clinic.findMany({
        where: { id: { in: clinicGroups.map((row) => row.clinicId) } },
        select: { id: true, name: true },
      }),
      this.prisma.db.doctor.findMany({
        where: { id: { in: doctorGroups.map((row) => row.doctorId) } },
        select: { id: true, displayName: true },
      }),
    ]);
    return {
      totals: {
        organizations,
        activeOrganizations,
        clinics,
        activeClinics,
        doctors,
        activeDoctors,
        staff,
        patients,
        appointmentsToday,
        appointmentsMonth,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShows,
        arrivals,
        liveQueues,
        waitingPatients,
        grossCommissionIqd: earned,
        reversalsIqd: reversed,
        netCommissionIqd: earned - reversed,
        draftStatements:
          statements.find((x) => x.status === 'draft')?._count._all ?? 0,
        finalizedStatements:
          statements.find((x) => x.status === 'finalized')?._count._all ?? 0,
      },
      appointmentTrend: counts(appointmentTrend),
      commissionTrend: commissionTrend.map((row) => ({
        day: row.day.toISOString().slice(0, 10),
        amountIqd: Number(row.amount),
      })),
      patientGrowth: counts(patientGrowth),
      clinicGrowth: counts(clinicGrowth),
      doctorGrowth: counts(doctorGrowth),
      cancellationTrend: counts(cancellationTrend),
      noShowTrend: counts(noShowTrend),
      busiestClinics: clinicGroups.map((x) => ({
        clinicId: x.clinicId,
        clinicName:
          clinicNames.find((clinic) => clinic.id === x.clinicId)?.name ??
          'Unknown clinic',
        count: x._count._all,
      })),
      busiestDoctors: doctorGroups.map((x) => ({
        doctorId: x.doctorId,
        doctorName:
          doctorNames.find((doctor) => doctor.id === x.doctorId)?.displayName ??
          'Unknown doctor',
        count: x._count._all,
      })),
    };
  }

  async audits(query: AuditQueryDto) {
    const rows = await this.prisma.db.auditEvent.findMany({
      where: {
        ...(query.actorId ? { actorUserId: query.actorId } : {}),
        ...(query.action ? { action: { contains: query.action } } : {}),
        ...(query.targetType ? { targetType: query.targetType } : {}),
        ...(query.organizationId
          ? { organizationId: query.organizationId }
          : {}),
        ...(query.clinicId ? { clinicId: query.clinicId } : {}),
        ...(query.from || query.to
          ? {
              occurredAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lt: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      ...(query.cursor
        ? { cursor: { id: this.uuidCursor(query.cursor) }, skip: 1 }
        : {}),
      orderBy: { id: 'desc' },
      take: query.pageSize + 1,
      select: {
        id: true,
        organizationId: true,
        clinicId: true,
        actorUserId: true,
        action: true,
        targetType: true,
        targetId: true,
        outcome: true,
        requestId: true,
        occurredAt: true,
      },
    });
    const items = rows.slice(0, query.pageSize);
    return {
      items: items.map((x) => ({
        ...x,
        occurredAt: x.occurredAt.toISOString(),
      })),
      nextCursor: rows.length > query.pageSize ? items.at(-1)!.id : null,
    };
  }

  async search(actorId: string, query: SearchQueryDto, requestId: string) {
    const q = query.q.trim();
    const take = query.limit;
    // Patient names are only searched with 3+ characters, and any search that
    // reveals patients is audited (without the search text).
    const includePatients = q.length >= 3;
    const [organizations, clinics, doctors, staff, patients, appointments] =
      await Promise.all([
        this.prisma.db.organization.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          take,
          select: { id: true, name: true },
        }),
        this.prisma.db.clinic.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            ],
          },
          take,
          select: { id: true, name: true, code: true },
        }),
        this.prisma.db.doctor.findMany({
          where: { displayName: { contains: q, mode: 'insensitive' } },
          take,
          select: { id: true, displayName: true, licenseNumber: true },
        }),
        this.prisma.db.staffAccount.findMany({
          where: { email: { contains: q, mode: 'insensitive' } },
          take,
          select: { id: true, email: true },
        }),
        includePatients
          ? this.prisma.db.patientProfile.findMany({
              where: {
                // Owner search covers app accounts; clinic-registered
                // patients stay inside their clinic's directory.
                patientAccountId: { not: null },
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              },
              take,
              distinct: ['patientAccountId'],
              select: {
                patientAccountId: true,
                firstName: true,
                lastName: true,
              },
            })
          : Promise.resolve([]),
        this.prisma.db.appointment.findMany({
          where: { publicReference: { contains: q, mode: 'insensitive' } },
          take,
          select: { id: true, publicReference: true, status: true },
        }),
      ]);
    if (patients.length)
      await this.prisma.db.auditEvent.create({
        data: {
          actorUserId: actorId,
          action: 'patient.search-viewed',
          targetType: 'patientAccount',
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
          metadata: { resultCount: patients.length },
        },
      });
    return [
      ...organizations.map((x) => ({
        category: 'organization',
        id: x.id,
        label: x.name,
        description: 'Organization',
        href: `/organizations?id=${x.id}`,
      })),
      ...clinics.map((x) => ({
        category: 'clinic',
        id: x.id,
        label: x.name,
        description: x.code,
        href: `/clinics?id=${x.id}`,
      })),
      ...doctors.map((x) => ({
        category: 'doctor',
        id: x.id,
        label: x.displayName,
        description: `License ${x.licenseNumber}`,
        href: `/doctors/${x.id}`,
      })),
      ...staff.map((x) => ({
        category: 'staff',
        id: x.id,
        label: x.email,
        description: 'Staff account',
        href: `/staff/${x.id}`,
      })),
      ...patients.map((x) => ({
        category: 'patient',
        id: x.patientAccountId,
        label: `${x.firstName} ${x.lastName}`,
        description: 'Patient account',
        href: `/patients/${x.patientAccountId}`,
      })),
      ...appointments.map((x) => ({
        category: 'appointment',
        id: x.id,
        label: x.publicReference,
        description: x.status,
        href: `/appointments?reference=${encodeURIComponent(x.publicReference)}`,
      })),
    ];
  }

  async documents(query: PlatformPageQueryDto) {
    const rows = await this.prisma.db.documentRecord.findMany({
      where: {
        status: { not: 'deleted' },
        ...(query.organizationId
          ? { organizationId: query.organizationId }
          : {}),
        ...(query.clinicId ? { clinicId: query.clinicId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.pageSize,
    });
    return rows.map((x) => this.document(x));
  }
  async createDocument(
    actorId: string,
    input: CreateDocumentDto,
    requestId: string,
  ) {
    const storageKey = `pending/${new Date().getUTCFullYear()}/${randomBytes(24).toString('hex')}`;
    const row = await this.prisma.db.$transaction(async (tx) => {
      await this.validateDocumentEntity(tx, input, actorId);
      const created = await tx.documentRecord.create({
        data: {
          ...input,
          category: input.category as never,
          storageKey,
          uploadedByUserId: actorId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });
      await this.audit(
        tx,
        actorId,
        'document.metadata-created',
        'document',
        created.id,
        requestId,
        input.organizationId,
        input.clinicId,
      );
      return created;
    });
    return this.document(row);
  }

  async uploadDocument(
    actorId: string,
    input: CreateDocumentDto,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    requestId: string,
  ) {
    if (
      file.size !== input.sizeBytes ||
      file.mimetype !== input.contentType ||
      file.originalname !== input.filename ||
      file.size > 26_214_400
    )
      throw new BadRequestException('Uploaded file metadata is inconsistent.');
    const validContent =
      (input.contentType === 'application/pdf' &&
        file.buffer.subarray(0, 5).toString() === '%PDF-') ||
      (input.contentType === 'image/jpeg' &&
        file.buffer[0] === 0xff &&
        file.buffer[1] === 0xd8) ||
      (input.contentType === 'image/png' &&
        file.buffer
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (input.contentType === 'text/plain' && !file.buffer.includes(0));
    if (!validContent)
      throw new BadRequestException(
        'Uploaded file content does not match its type.',
      );
    const storageKey = `documents/${new Date().getUTCFullYear()}/${randomBytes(24).toString('hex')}`;
    await this.documentStorage.put(storageKey, file.buffer);
    try {
      const row = await this.prisma.db.$transaction(async (tx) => {
        await this.validateDocumentEntity(tx, input, actorId);
        const created = await tx.documentRecord.create({
          data: {
            ...input,
            category: input.category as never,
            storageKey,
            status: 'available',
            uploadedByUserId: actorId,
            uploadedAt: new Date(),
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          },
        });
        await this.audit(
          tx,
          actorId,
          'document.uploaded',
          'document',
          created.id,
          requestId,
          input.organizationId,
          input.clinicId,
        );
        return created;
      });
      return this.document(row);
    } catch (error) {
      await this.documentStorage.remove(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async downloadDocument(actorId: string, id: string, requestId: string) {
    const row = await this.prisma.db.documentRecord.findFirst({
      where: { id, status: 'available', deletedAt: null },
    });
    if (!row) throw new NotFoundException('Document was not found.');
    const content = await this.documentStorage.read(row.storageKey);
    await this.prisma.db.auditEvent.create({
      data: {
        actorUserId: actorId,
        action: 'document.downloaded',
        targetType: 'document',
        targetId: id,
        outcome: 'succeeded',
        requestId,
        occurredAt: new Date(),
        organizationId: row.organizationId,
        clinicId: row.clinicId,
        metadata: { contentType: row.contentType, sizeBytes: row.sizeBytes },
      },
    });
    return { metadata: this.document(row), content };
  }
  async deleteDocument(actorId: string, id: string, requestId: string) {
    const result = await this.prisma.db.$transaction(async (tx) => {
      const row = await tx.documentRecord.findFirst({
        where: { id, status: { not: 'deleted' } },
      });
      if (!row) throw new NotFoundException('Document was not found.');
      const updated = await tx.documentRecord.update({
        where: { id },
        data: { status: 'deleted', deletedAt: new Date() },
      });
      await this.audit(
        tx,
        actorId,
        'document.deleted',
        'document',
        id,
        requestId,
        row.organizationId ?? undefined,
        row.clinicId ?? undefined,
      );
      return { response: this.document(updated), storageKey: row.storageKey };
    });
    await this.documentStorage.remove(result.storageKey);
    return result.response;
  }

  async onboardDoctor(
    actorId: string,
    input: DoctorOnboardingDto,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const clinic = await tx.clinic.findFirst({
        where: {
          id: input.clinicId,
          organizationId: input.organizationId,
          status: 'active',
        },
        select: { id: true },
      });
      const specialty = await tx.specialty.findFirst({
        where: { id: input.specialtyId, status: 'active' },
        select: { id: true },
      });
      if (!clinic)
        throw new NotFoundException(
          'Active clinic was not found in the organization.',
        );
      if (!specialty)
        throw new NotFoundException('Active specialty was not found.');
      const email = input.email.trim().toLowerCase();
      if (
        await tx.staffAccount.findUnique({
          where: { email },
          select: { id: true },
        })
      )
        throw new ConflictException(
          'A staff account with this email already exists.',
        );
      const user = await tx.user.create({ data: { status: 'inactive' } });
      const staff = await tx.staffAccount.create({
        data: { userId: user.id, email },
      });
      const doctor = await tx.doctor.create({
        data: {
          organizationId: input.organizationId,
          staffAccountId: staff.id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          displayName: input.displayName.trim(),
          gender: input.gender as never,
          licenseNumber: input.licenseNumber.trim(),
          yearsOfExperience: input.yearsOfExperience,
          languages: input.languages.map((x) => x.trim()).filter(Boolean),
          biography: input.biography?.trim() ?? '',
        },
      });
      await tx.doctorClinicAssignment.create({
        data: {
          organizationId: input.organizationId,
          clinicId: input.clinicId,
          doctorId: doctor.id,
        },
      });
      await tx.doctorSpecialtyAssignment.create({
        data: {
          doctorId: doctor.id,
          specialtyId: input.specialtyId,
          isPrimary: true,
        },
      });
      await tx.identityRoleAssignment.create({
        data: {
          userId: user.id,
          organizationId: input.organizationId,
          clinicId: input.clinicId,
          role: 'doctor',
        },
      });
      await tx.clinicMembership.create({
        data: {
          userId: user.id,
          organizationId: input.organizationId,
          clinicId: input.clinicId,
          role: 'doctor',
        },
      });
      await this.audit(
        tx,
        actorId,
        'doctor.onboarded',
        'doctor',
        doctor.id,
        requestId,
        input.organizationId,
        input.clinicId,
      );
      const activationCredential = await this.issueActivation(tx, staff.id);
      return {
        id: doctor.id,
        status: doctor.status,
        email,
        activationRequired: true,
        activationCredential,
        activationExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        version: doctor.version,
      };
    });
  }

  specialties() {
    return this.prisma.db.specialty.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
      select: { id: true, code: true, displayName: true },
    });
  }

  async doctorDetail(id: string) {
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id },
      include: {
        specialtyAssignments: { include: { specialty: true } },
        clinicAssignments: {
          where: { status: 'active' },
          include: { clinic: true },
        },
        availability: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor was not found.');
    const primary =
      doctor.specialtyAssignments.find((item) => item.isPrimary)?.specialty ??
      doctor.specialtyAssignments[0]?.specialty;
    return {
      id: doctor.id,
      displayName: doctor.displayName,
      fullName: `${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialty: primary?.displayName ?? 'Unassigned',
      gender: doctor.gender,
      status: doctor.status,
      yearsOfExperience: doctor.yearsOfExperience,
      languages: doctor.languages,
      profileImageUrl: null,
      clinics: doctor.clinicAssignments.map((item) => ({
        id: item.clinic.id,
        name: item.clinic.name,
      })),
      availability: doctor.availability
        ? {
            status: doctor.availability.status,
            acceptingNewPatients: doctor.availability.acceptingNewPatients,
            nextAvailableAt:
              doctor.availability.nextAvailableAt?.toISOString() ?? null,
            updatedAt: doctor.availability.updatedAt.toISOString(),
          }
        : {
            status: 'unavailable',
            acceptingNewPatients: false,
            nextAvailableAt: null,
            updatedAt: null,
          },
      licenseNumber: doctor.licenseNumber,
      biography: doctor.biography,
      specialties: doctor.specialtyAssignments.map((item) => ({
        id: item.specialty.id,
        code: item.specialty.code,
        displayName: item.specialty.displayName,
        isPrimary: item.isPrimary,
      })),
      version: doctor.version,
    };
  }

  async updateDoctor(
    actorId: string,
    id: string,
    input: UpdateDoctorAdminDto,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const result = await tx.doctor.updateMany({
        where: { id, version: input.version },
        data: {
          ...(input.displayName
            ? { displayName: input.displayName.trim() }
            : {}),
          ...(input.biography !== undefined
            ? { biography: input.biography.trim() }
            : {}),
          ...(input.yearsOfExperience !== undefined
            ? { yearsOfExperience: input.yearsOfExperience }
            : {}),
          ...(input.languages
            ? {
                languages: input.languages.map((x) => x.trim()).filter(Boolean),
              }
            : {}),
          ...(input.status ? { status: input.status as never } : {}),
          version: { increment: 1 },
        },
      });
      if (!result.count) {
        if (
          !(await tx.doctor.findUnique({ where: { id }, select: { id: true } }))
        )
          throw new NotFoundException('Doctor was not found.');
        throw new ConflictException('Doctor changed since it was loaded.');
      }
      const doctor = await tx.doctor.findUniqueOrThrow({ where: { id } });
      await this.audit(
        tx,
        actorId,
        'doctor.updated',
        'doctor',
        id,
        requestId,
        doctor.organizationId,
      );
      return {
        id: doctor.id,
        status: doctor.status,
        version: doctor.version,
        displayName: doctor.displayName,
      };
    });
  }

  settings(actorId: string) {
    return this.prisma.db.user
      .findUnique({
        where: { id: actorId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          roles: { select: { role: true } },
        },
      })
      .then((user) => ({
        identity: user
          ? {
              id: user.id,
              status: user.status,
              roles: user.roles.map((x) => x.role),
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            }
          : null,
        apiVersion: 'v1',
        environment: this.configuration.environment,
      }));
  }

  async activateStaff(token: string, password: string) {
    const tokenHash = this.activationHash(token);
    if (!(await this.rateLimit.consume(tokenHash, 'login', 'subject')))
      throw new HttpException('Too many activation attempts.', 429);
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tokenHash}, 0))`;
      const activation = await tx.staffActivationToken.findUnique({
        where: { tokenHash },
        include: { staffAccount: { include: { user: true } } },
      });
      if (
        !activation ||
        activation.consumedAt ||
        activation.expiresAt <= new Date()
      )
        throw new BadRequestException(
          'The activation credential is invalid or expired.',
        );
      const now = new Date();
      await tx.staffAccount.update({
        where: { id: activation.staffAccountId },
        data: { passwordHash: await hashPassword(password) },
      });
      await tx.user.update({
        where: { id: activation.staffAccount.userId },
        data: {
          status: 'active',
          authorizationVersion: { increment: 1 },
        },
      });
      await tx.staffActivationToken.update({
        where: { id: activation.id },
        data: { consumedAt: now },
      });
      await tx.staffActivationToken.updateMany({
        where: {
          staffAccountId: activation.staffAccountId,
          consumedAt: null,
          id: { not: activation.id },
        },
        data: { consumedAt: now },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: activation.staffAccount.userId,
          action: 'staff.activation-completed',
          targetType: 'staffAccount',
          targetId: activation.staffAccountId,
          outcome: 'succeeded',
          requestId: `activation:${activation.id}`,
          occurredAt: now,
        },
      });
      return { activated: true };
    });
  }

  private staffRecord(row: StaffRow) {
    return {
      userId: row.userId,
      staffAccountId: row.id,
      email: row.email,
      status: row.user.status,
      roles: row.user.roles.map((x) => ({
        id: x.id,
        role: x.role,
        organizationId: x.organizationId,
        clinicId: x.clinicId,
      })),
      memberships: row.user.memberships.map((x) => ({
        id: x.id,
        organizationId: x.organizationId,
        clinicId: x.clinicId,
        role: x.role,
        status: x.status,
        organizationName: x.organization.name,
        clinicName: x.clinic.name,
      })),
      doctorId: row.doctor?.id ?? null,
      doctorName: row.doctor?.displayName ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  private async staffDetailWithin(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.staffAccount.findUniqueOrThrow({
      where: { id },
      include: {
        user: {
          include: {
            roles: true,
            memberships: { include: { organization: true, clinic: true } },
          },
        },
        doctor: { select: { id: true, displayName: true } },
      },
    });
    return this.staffRecord(row);
  }
  private patientSummary(
    row: PatientRow,
    appointmentCount: number,
    recent: Date | null,
  ) {
    return {
      accountId: row.id,
      userId: row.userId,
      maskedPhone: this.maskPhone(row.normalizedPhoneNumber),
      status: row.user.status,
      displayName: row.profiles[0]
        ? `${row.profiles[0].firstName} ${row.profiles[0].lastName}`
        : 'Profile setup pending',
      profileCount: row.profiles.length,
      appointmentCount,
      mostRecentAppointmentAt: recent?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
  private document(x: DocumentRecord) {
    return {
      id: x.id,
      entityType: x.entityType,
      entityId: x.entityId,
      organizationId: x.organizationId,
      clinicId: x.clinicId,
      category: x.category,
      filename: x.filename,
      contentType: x.contentType,
      sizeBytes: x.sizeBytes,
      status: x.status,
      uploadedAt: x.uploadedAt?.toISOString() ?? null,
      expiresAt: x.expiresAt?.toISOString() ?? null,
      createdAt: x.createdAt.toISOString(),
    };
  }
  private async validateDocumentEntity(
    tx: Prisma.TransactionClient,
    input: CreateDocumentDto,
    actorId: string,
  ) {
    const valid = async () => {
      if (
        input.category === 'organization' &&
        input.entityType === 'organization' &&
        !input.clinicId &&
        (!input.organizationId || input.organizationId === input.entityId)
      )
        return tx.organization.findUnique({
          where: { id: input.entityId },
          select: { id: true },
        });
      if (
        input.category === 'clinic' &&
        input.entityType === 'clinic' &&
        (!input.clinicId || input.clinicId === input.entityId)
      )
        return tx.clinic.findFirst({
          where: {
            id: input.entityId,
            ...(input.organizationId
              ? { organizationId: input.organizationId }
              : {}),
          },
          select: { id: true },
        });
      if (
        ['doctor', 'license'].includes(input.category) &&
        input.entityType === 'doctor'
      )
        return tx.doctor.findFirst({
          where: {
            id: input.entityId,
            ...(input.organizationId
              ? { organizationId: input.organizationId }
              : {}),
          },
          select: { id: true },
        });
      if (
        ['statement', 'billing'].includes(input.category) &&
        input.entityType === 'billingStatement'
      )
        return tx.billingStatement.findFirst({
          where: {
            id: input.entityId,
            ...(input.organizationId
              ? { organizationId: input.organizationId }
              : {}),
          },
          select: { id: true },
        });
      if (
        ['platform', 'legal', 'report'].includes(input.category) &&
        input.entityType === 'platform' &&
        input.entityId === actorId &&
        !input.organizationId &&
        !input.clinicId
      )
        return tx.user.findUnique({
          where: { id: actorId },
          select: { id: true },
        });
      return null;
    };
    if (!(await valid()))
      throw new BadRequestException(
        'Document category, entity, and scope are inconsistent.',
      );
  }
  private maskPhone(value: string) {
    return value.length < 6
      ? '***'
      : `${value.slice(0, 4)}••••${value.slice(-2)}`;
  }
  private async issueActivation(
    tx: Prisma.TransactionClient,
    staffAccountId: string,
  ) {
    const token = randomBytes(32).toString('base64url');
    await tx.staffActivationToken.updateMany({
      where: { staffAccountId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.staffActivationToken.create({
      data: {
        staffAccountId,
        tokenHash: this.activationHash(token),
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
    });
    return token;
  }
  private activationHash(token: string) {
    return keyedHash(
      'staff-activation',
      token,
      this.configuration.auditHashSecret,
    );
  }
  private uuidCursor(value: string) {
    if (!this.isUuid(value))
      throw new BadRequestException('Cursor is invalid.');
    return value;
  }
  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      value,
    );
  }
  private audit(
    tx: Prisma.TransactionClient,
    actorUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    requestId: string,
    organizationId?: string,
    clinicId?: string,
  ) {
    return tx.auditEvent
      .create({
        data: {
          actorUserId,
          action,
          targetType,
          targetId,
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
          ...(organizationId ? { organizationId } : {}),
          ...(clinicId ? { clinicId } : {}),
        },
      })
      .then(() => undefined);
  }
}
