import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  APPOINTMENT_QUEUE_COMPLETION_PORT,
  type AppointmentQueueCompletionPort,
} from '../../appointments/domain/appointment-queue-completion.port';
import { AppointmentAuditPersistenceError } from '../../appointments/domain/appointment.errors';
import { keyedHash, safeEqualHex } from '../../identity/domain/security';
import {
  deriveQueueHealth,
  deriveWaitRange,
  isRecallAllowed,
  type PatientQueueStatus,
  type QueueAccess,
  type QueueCommand,
  type QueueEntryProjection,
  type QueueEntryPage,
  type QueuePolicy,
  type QueueSnapshot,
} from '../domain/queue';
import type { QueueRepository } from '../domain/queue.repository';

const include = {
  clinic: { select: { id: true, name: true } },
  doctorAssignment: {
    select: { doctor: { select: { id: true, displayName: true } } },
  },
  entries: {
    include: {
      appointment: { select: { publicReference: true } },
      patientRegistration: {
        select: {
          patientProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { ticketNumber: 'asc' as const },
  },
  activities: {
    include: { queueEntry: { select: { ticketNumber: true } } },
    orderBy: { occurredAt: 'desc' as const },
    take: 20,
  },
} as const;
type SessionRow = Prisma.QueueSessionGetPayload<{ include: typeof include }>;

@Injectable()
export class PrismaQueueRepository implements QueueRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APPOINTMENT_QUEUE_COMPLETION_PORT)
    private readonly appointmentCompletion: AppointmentQueueCompletionPort,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  async operationalDate(clinicId: string, now: Date): Promise<Date> {
    const clinic = await this.prisma.db.clinic.findUnique({
      where: { id: clinicId },
      select: { timezone: true },
    });
    if (!clinic) throw new NotFoundException('Clinic was not found.');
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: clinic.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);
      return new Date(
        Date.UTC(value('year'), value('month') - 1, value('day')),
      );
    } catch {
      throw new ServiceUnavailableException(
        'Clinic timezone configuration is invalid.',
      );
    }
  }

  async get(access: QueueAccess, id: string) {
    const row = await this.prisma.db.queueSession.findFirst({
      where: { id, ...this.scope(access) },
      include,
    });
    return row ? this.map(row) : null;
  }

  async getCurrent(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    now: Date,
  ) {
    const active = await this.prisma.db.queueSession.findFirst({
      where: {
        clinicId,
        doctorId,
        status: { in: ['open', 'paused'] },
        ...this.scope(access),
      },
      orderBy: { createdAt: 'desc' },
      include,
    });
    if (active) return this.map(active);
    const operationalDate = await this.operationalDate(clinicId, now);
    const row = await this.prisma.db.queueSession.findFirst({
      where: { clinicId, doctorId, operationalDate, ...this.scope(access) },
      include,
    });
    return row ? this.map(row) : null;
  }

  async listEntries(
    access: QueueAccess,
    id: string,
    pageSize: number,
    cursor?: string,
    includeTerminal = false,
  ): Promise<QueueEntryPage | null> {
    const session = await this.prisma.db.queueSession.findFirst({
      where: { id, ...this.scope(access) },
      select: { id: true },
    });
    if (!session) return null;
    const decoded = cursor ? this.decodeCursor(cursor, id) : null;
    const rows = await this.prisma.db.queueEntry.findMany({
      where: {
        queueSessionId: id,
        ...(!includeTerminal
          ? { status: { in: ['waiting', 'called', 'inConsultation'] } }
          : {}),
        ...(decoded
          ? {
              OR: [
                { ticketNumber: { gt: decoded.ticketNumber } },
                {
                  ticketNumber: decoded.ticketNumber,
                  id: { gt: decoded.id },
                },
              ],
            }
          : {}),
      },
      include: {
        appointment: { select: { publicReference: true } },
        patientRegistration: {
          select: {
            patientProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ ticketNumber: 'asc' }, { id: 'asc' }],
      take: pageSize + 1,
    });
    const hasNext = rows.length > pageSize;
    const items = (hasNext ? rows.slice(0, pageSize) : rows).map((row) =>
      this.mapEntry(row),
    );
    const last = items.at(-1);
    return Object.freeze({
      items: Object.freeze(items),
      nextCursor:
        hasNext && last
          ? this.encodeCursor({
              sessionId: id,
              ticketNumber: last.ticketNumber,
              id: last.id,
            })
          : null,
    });
  }

  async getPatientStatus(
    access: QueueAccess,
    appointmentId: string,
    policy: QueuePolicy,
  ): Promise<PatientQueueStatus | null> {
    if (!access.patient)
      throw new ForbiddenException('Patient access required.');
    const entry = await this.prisma.db.queueEntry.findFirst({
      where: {
        appointmentId,
        appointment: {
          patientRegistration: {
            patientProfile: { patientAccount: { userId: access.actorId } },
          },
        },
      },
      include: {
        appointment: { select: { publicReference: true } },
        queueSession: {
          include: {
            clinic: { select: { id: true, name: true } },
            doctorAssignment: {
              select: {
                doctor: { select: { id: true, displayName: true } },
              },
            },
            entries: {
              select: {
                ticketNumber: true,
                status: true,
                consultationStartedAt: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });
    if (!entry) return null;
    const activeAhead = entry.queueSession.entries.filter(
      (candidate) =>
        candidate.ticketNumber < entry.ticketNumber &&
        ['waiting', 'called', 'inConsultation'].includes(candidate.status),
    );
    const completedDurations = entry.queueSession.entries
      .filter(
        (candidate) => candidate.consultationStartedAt && candidate.completedAt,
      )
      .map(
        (candidate) =>
          (candidate.completedAt!.getTime() -
            candidate.consultationStartedAt!.getTime()) /
          60_000,
      )
      .filter((value) => Number.isFinite(value) && value > 0 && value <= 480);
    const average =
      completedDurations.length > 0
        ? completedDurations.reduce((sum, value) => sum + value, 0) /
          completedDurations.length
        : policy.fallbackConsultationMinutes;
    const current = entry.queueSession.entries.find((candidate) =>
      ['called', 'inConsultation'].includes(candidate.status),
    );
    const elapsed = current?.consultationStartedAt
      ? (Date.now() - current.consultationStartedAt.getTime()) / 60_000
      : 0;
    const remaining = current ? Math.max(0, average - elapsed) : 0;
    const paused = entry.queueSession.status === 'paused';
    const waitingAhead = activeAhead.filter(
      (candidate) => candidate.status === 'waiting',
    ).length;
    const openedAt = entry.queueSession.entries
      .map((candidate) => candidate.consultationStartedAt)
      .filter((value): value is Date => value !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const completedCount = entry.queueSession.entries.filter(
      (candidate) => candidate.status === 'completed',
    ).length;
    const operationalBehind = openedAt
      ? Math.max(
          0,
          (Date.now() - openedAt.getTime()) / 60_000 - completedCount * average,
        )
      : 0;
    const health = deriveQueueHealth(operationalBehind, policy);
    return Object.freeze({
      queueState: entry.queueSession.status,
      ticketNumber: entry.ticketNumber,
      currentTicket: current?.ticketNumber ?? null,
      patientsAhead: activeAhead.length,
      estimatedWait: paused
        ? null
        : deriveWaitRange(waitingAhead, average, remaining),
      estimateSuspended: paused,
      queueHealth: health,
      doctor: {
        id: entry.queueSession.doctorAssignment.doctor.id,
        name: entry.queueSession.doctorAssignment.doctor.displayName,
      },
      clinic: entry.queueSession.clinic,
      appointmentReference: entry.appointment.publicReference,
      status: entry.status,
      instruction: paused
        ? 'The queue is paused. Your position is safe; please wait for an update.'
        : entry.status === 'called'
          ? 'Please head to the consultation room.'
          : entry.status === 'inConsultation'
            ? 'Your consultation is in progress.'
            : 'Please stay nearby. We will keep your position updated.',
      lastUpdatedAt: entry.updatedAt.toISOString(),
    });
  }

  async open(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    operationalDate: Date,
    recallGraceMinutes: number,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ) {
    const organizationId = this.tenant(access, clinicId);
    return this.transaction(async (tx) => {
      const replay = await this.begin(tx, access, command);
      if (replay) return replay;
      await this.lock(
        tx,
        `${organizationId}:${clinicId}:${doctorId}:${operationalDate.toISOString()}`,
      );
      await this.assertDoctorScope(
        tx,
        access,
        organizationId,
        clinicId,
        doctorId,
      );
      let row = await tx.queueSession.findUnique({
        where: {
          organizationId_clinicId_doctorId_operationalDate: {
            organizationId,
            clinicId,
            doctorId,
            operationalDate,
          },
        },
        include,
      });
      if (row)
        await tx.$queryRaw`SELECT "id" FROM "queue_sessions"
          WHERE "id" = ${row.id}::uuid FOR UPDATE`;
      if (!row) {
        const clinic = await tx.clinic.findUniqueOrThrow({
          where: { id: clinicId },
          select: { timezone: true },
        });
        const [created] = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT queue_create_session(
            ${organizationId}::uuid,
            ${clinicId}::uuid,
            ${doctorId}::uuid,
            ${operationalDate}::date,
            ${clinic.timezone}::text,
            ${recallGraceMinutes}::integer
          ) AS id`;
        row = await tx.queueSession.findUniqueOrThrow({
          where: { id: created!.id },
          include,
        });
      }
      if (row.status === 'open' && row.version !== expectedVersion)
        throw new ConflictException('Queue version is stale.');
      if (row.status === 'open')
        throw new ConflictException('Queue is already open.');
      if (row.status !== 'notStarted' || row.version !== expectedVersion)
        throw new ConflictException('Queue state or version is stale.');
      row = await tx.queueSession.update({
        where: { id: row.id },
        data: { status: 'open', openedAt: now, version: { increment: 1 } },
        include,
      });
      await this.record(
        tx,
        access,
        row,
        null,
        'queue.session.opened',
        requestId,
        now,
      );
      return this.finish(tx, access, command, this.map(row));
    });
  }

  async enqueue(
    access: QueueAccess,
    id: string,
    appointmentId: string,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ) {
    return this.transaction(async (tx) => {
      const replay = await this.begin(tx, access, command);
      if (replay) return replay;
      await this.lock(tx, id);
      let session = await this.session(tx, access, id);
      if (!['open', 'paused'].includes(session.status))
        throw new ConflictException('Queue state is stale.');
      await tx.$queryRaw`SELECT "id" FROM "appointments" WHERE "id" = ${appointmentId}::uuid FOR UPDATE`;
      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          organizationId: session.organizationId,
          clinicId: session.clinicId,
          doctorId: session.doctorId,
        },
        include: {
          organization: { select: { status: true } },
          clinic: { select: { status: true } },
          doctorAssignment: {
            select: {
              status: true,
              doctor: { select: { status: true } },
            },
          },
          patientRegistration: {
            select: {
              status: true,
              patientProfile: { select: { status: true } },
            },
          },
          arrival: true,
        },
      });
      if (!appointment)
        throw new NotFoundException('Appointment was not found.');
      await this.lockEnqueueParticipants(tx, appointment);
      const eligible = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          organizationId: session.organizationId,
          clinicId: session.clinicId,
          doctorId: session.doctorId,
        },
        include: {
          organization: { select: { status: true } },
          clinic: { select: { status: true } },
          doctorAssignment: {
            select: {
              status: true,
              doctor: { select: { status: true } },
            },
          },
          patientRegistration: {
            select: {
              status: true,
              patientProfile: { select: { status: true } },
            },
          },
          arrival: true,
        },
      });
      if (!eligible) throw new NotFoundException('Appointment was not found.');
      if (
        !['scheduled', 'confirmed'].includes(eligible.status) ||
        eligible.arrival?.status !== 'queueReady' ||
        eligible.organization.status !== 'active' ||
        eligible.clinic.status !== 'active' ||
        eligible.doctorAssignment.status !== 'active' ||
        eligible.doctorAssignment.doctor.status !== 'active' ||
        eligible.patientRegistration.status !== 'active' ||
        eligible.patientRegistration.patientProfile.status !== 'active'
      )
        throw new ConflictException(
          'Appointment is not eligible for this queue.',
        );
      const arrival = eligible.arrival;
      if (!arrival)
        throw new ConflictException(
          'Appointment is not eligible for this queue.',
        );
      const duplicate = await tx.queueEntry.findFirst({
        where: {
          OR: [{ appointmentId }, { arrivalId: arrival.id }],
        },
      });
      if (duplicate)
        throw new ConflictException('Appointment is already enqueued.');
      const [created] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT queue_create_entry(
          ${session.organizationId}::uuid,
          ${session.clinicId}::uuid,
          ${session.id}::uuid,
          ${appointmentId}::uuid,
          ${arrival.id}::uuid,
          ${eligible.patientProfileId}::uuid,
          ${session.nextTicket}::integer
        ) AS id`;
      const entry = await tx.queueEntry.findUniqueOrThrow({
        where: { id: created!.id },
      });
      session = await tx.queueSession.update({
        where: { id: session.id },
        data: { nextTicket: { increment: 1 }, version: { increment: 1 } },
        include,
      });
      await this.record(
        tx,
        access,
        session,
        entry.id,
        'queue.entry.enqueued',
        requestId,
        now,
      );
      return this.finish(tx, access, command, this.map(session));
    });
  }

  async transitionSession(
    access: QueueAccess,
    id: string,
    operation: 'pause' | 'resume' | 'close',
    expectedVersion: number,
    reason: string | null,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ) {
    return this.transaction(async (tx) => {
      const replay = await this.begin(tx, access, command);
      if (replay) return replay;
      await this.lock(tx, id);
      let session = await this.session(tx, access, id);
      if (session.version !== expectedVersion)
        throw new ConflictException('Queue version is stale.');
      const target =
        operation === 'pause'
          ? 'paused'
          : operation === 'resume'
            ? 'open'
            : 'closed';
      const valid =
        (operation === 'pause' && session.status === 'open') ||
        (operation === 'resume' && session.status === 'paused') ||
        (operation === 'close' && ['open', 'paused'].includes(session.status));
      if (!valid) throw new ConflictException('Queue transition is invalid.');
      if (
        operation === 'close' &&
        session.entries.some((entry) =>
          ['waiting', 'called', 'inConsultation'].includes(entry.status),
        )
      )
        throw new ConflictException('Queue still has unresolved work.');
      session = await tx.queueSession.update({
        where: { id },
        data: {
          status: target,
          pausedAt:
            operation === 'pause'
              ? (session.pausedAt ?? now)
              : session.pausedAt,
          pauseReason:
            operation === 'pause'
              ? reason
              : operation === 'resume'
                ? null
                : session.pauseReason,
          closedAt: operation === 'close' ? now : null,
          version: { increment: 1 },
        },
        include,
      });
      await this.record(
        tx,
        access,
        session,
        null,
        `queue.session.${operation === 'resume' ? 'resumed' : `${operation}d`}`,
        requestId,
        now,
      );
      return this.finish(tx, access, command, this.map(session));
    });
  }

  async callNext(
    access: QueueAccess,
    id: string,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ) {
    return this.transaction(async (tx) => {
      const replay = await this.begin(tx, access, command);
      if (replay) return replay;
      await this.lock(tx, id);
      let session = await this.session(tx, access, id);
      if (session.status !== 'open' || session.version !== expectedVersion)
        throw new ConflictException(
          'Queue is not open or the version is stale.',
        );
      if (
        session.entries.some((entry) =>
          ['called', 'inConsultation'].includes(entry.status),
        )
      )
        throw new ConflictException('A patient is already current.');
      const next = session.entries.find((entry) => entry.status === 'waiting');
      if (!next) throw new ConflictException('No patient is waiting.');
      await tx.queueEntry.update({
        where: { id: next.id },
        data: { status: 'called', calledAt: now, version: { increment: 1 } },
      });
      session = await tx.queueSession.update({
        where: { id },
        data: { version: { increment: 1 } },
        include,
      });
      await this.record(
        tx,
        access,
        session,
        next.id,
        'queue.patient.called',
        requestId,
        now,
      );
      return this.finish(tx, access, command, this.map(session));
    });
  }

  async transitionEntry(
    access: QueueAccess,
    id: string,
    entryId: string,
    operation: 'recall' | 'no-response' | 'start' | 'complete',
    sessionVersion: number,
    entryVersion: number,
    policy: QueuePolicy,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ) {
    return this.transaction(async (tx) => {
      const replay = await this.begin(tx, access, command);
      if (replay) return replay;
      await this.lock(tx, id);
      let session = await this.session(tx, access, id);
      const entry = session.entries.find(
        (candidate) => candidate.id === entryId,
      );
      if (!entry) throw new NotFoundException('Queue entry was not found.');
      if (session.version !== sessionVersion || entry.version !== entryVersion)
        throw new ConflictException('Queue or entry version is stale.');
      const expected = {
        recall: 'noResponse',
        'no-response': 'called',
        start: 'called',
        complete: 'inConsultation',
      }[operation];
      if (entry.status !== expected)
        throw new ConflictException('Queue entry transition is invalid.');
      if (operation === 'recall') {
        if (
          !entry.noResponseAt ||
          !isRecallAllowed(entry.noResponseAt, now, policy.recallGraceMinutes)
        )
          throw new ConflictException('The recall grace period has expired.');
        if (
          session.status !== 'open' ||
          session.entries.some((candidate) =>
            ['called', 'inConsultation'].includes(candidate.status),
          )
        )
          throw new ConflictException('Recall is not currently available.');
      }
      if (operation === 'start' && session.status !== 'open')
        throw new ConflictException(
          'Consultation cannot start while the queue is paused.',
        );
      const target =
        operation === 'recall'
          ? 'called'
          : operation === 'no-response'
            ? 'noResponse'
            : operation === 'start'
              ? 'inConsultation'
              : 'completed';
      await tx.queueEntry.update({
        where: { id: entryId },
        data: {
          status: target,
          recalledAt: operation === 'recall' ? now : entry.recalledAt,
          calledAt: operation === 'recall' ? now : entry.calledAt,
          noResponseAt: operation === 'no-response' ? now : entry.noResponseAt,
          recallDeadlineAt:
            operation === 'no-response'
              ? new Date(now.getTime() + policy.recallGraceMinutes * 60_000)
              : entry.recallDeadlineAt,
          consultationStartedAt:
            operation === 'start' ? now : entry.consultationStartedAt,
          completedAt: operation === 'complete' ? now : entry.completedAt,
          version: { increment: 1 },
        },
      });
      if (operation === 'complete') {
        const appointment = await tx.appointment.findUnique({
          where: { id: entry.appointmentId },
        });
        if (!appointment)
          throw new ConflictException('Appointment cannot be completed.');
        await this.appointmentCompletion.completeFromQueue(tx, {
          appointmentId: appointment.id,
          expectedVersion: appointment.version,
          queueSessionId: id,
          queueEntryId: entryId,
          actorUserId: access.actorId,
          requestId,
          occurredAt: now,
        });
      }
      session = await tx.queueSession.update({
        where: { id },
        data: { version: { increment: 1 } },
        include,
      });
      const action = {
        recall: 'queue.patient.recalled',
        'no-response': 'queue.patient.no-response',
        start: 'queue.consultation.started',
        complete: 'queue.consultation.completed',
      }[operation];
      await this.record(tx, access, session, entryId, action, requestId, now);
      return this.finish(tx, access, command, this.map(session));
    });
  }

  private tenant(access: QueueAccess, clinicId: string): string {
    if (!access.organizationId)
      throw new ForbiddenException('Clinic tenant context is required.');
    if (access.clinicId !== clinicId)
      throw new NotFoundException('Queue was not found.');
    return access.organizationId;
  }
  private scope(access: QueueAccess): Prisma.QueueSessionWhereInput {
    if (access.platformAdministrator) return {};
    if (access.doctor) {
      if (!access.organizationId || !access.clinicId)
        throw new ForbiddenException('Doctor tenant context is required.');
      return {
        organizationId: access.organizationId,
        clinicId: access.clinicId,
        doctorAssignment: {
          status: 'active',
          doctor: {
            status: 'active',
            staffAccount: { userId: access.actorId },
          },
          clinic: { status: 'active', organization: { status: 'active' } },
        },
      };
    }
    if (!access.organizationId || !access.clinicId)
      throw new ForbiddenException('Staff tenant context is required.');
    return {
      organizationId: access.organizationId,
      clinicId: access.clinicId,
    };
  }
  private async assertDoctorScope(
    tx: Prisma.TransactionClient,
    access: QueueAccess,
    organizationId: string,
    clinicId: string,
    doctorId: string,
  ) {
    const assignment = await tx.doctorClinicAssignment.findFirst({
      where: {
        organizationId,
        clinicId,
        doctorId,
        clinic: { status: 'active', organization: { status: 'active' } },
        status: 'active',
        doctor: {
          status: 'active',
          ...(access.doctor
            ? { staffAccount: { userId: access.actorId } }
            : {}),
        },
      },
    });
    if (!assignment)
      throw new NotFoundException('Doctor assignment was not found.');
  }
  private async lockEnqueueParticipants(
    tx: Prisma.TransactionClient,
    appointment: {
      id: string;
      organizationId: string;
      clinicId: string;
      doctorId: string;
      patientProfileId: string;
      arrival: { id: string } | null;
    },
  ) {
    if (!appointment.arrival)
      throw new ConflictException('Appointment is not ready for the queue.');
    await tx.$queryRaw`SELECT "id" FROM "appointment_arrivals" WHERE "id" = ${appointment.arrival.id}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "organizations" WHERE "id" = ${appointment.organizationId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "clinics" WHERE "id" = ${appointment.clinicId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "doctors" WHERE "id" = ${appointment.doctorId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "doctor_id" FROM "doctor_clinic_assignments"
      WHERE "organization_id" = ${appointment.organizationId}::uuid
        AND "clinic_id" = ${appointment.clinicId}::uuid
        AND "doctor_id" = ${appointment.doctorId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "patient_profile_id" FROM "organization_patient_profiles"
      WHERE "organization_id" = ${appointment.organizationId}::uuid
        AND "patient_profile_id" = ${appointment.patientProfileId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "patient_profiles"
      WHERE "id" = ${appointment.patientProfileId}::uuid FOR UPDATE`;
  }
  private async session(
    tx: Prisma.TransactionClient,
    access: QueueAccess,
    id: string,
  ) {
    await tx.$queryRaw`SELECT "id" FROM "queue_sessions"
      WHERE "id" = ${id}::uuid FOR UPDATE`;
    const row = await tx.queueSession.findFirst({
      where: { id, ...this.scope(access) },
      include,
    });
    if (!row) throw new NotFoundException('Queue was not found.');
    return row;
  }
  private async lock(tx: Prisma.TransactionClient, scope: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`queue:${scope}`}, 0))`;
  }
  private async begin(
    tx: Prisma.TransactionClient,
    access: QueueAccess,
    command: QueueCommand,
  ): Promise<QueueSnapshot | null> {
    await this.lock(tx, `${access.actorId}:${command.scope}:${command.key}`);
    const existing = await tx.idempotencyRecord.findUnique({
      where: {
        actorId_scope_key: {
          actorId: access.actorId,
          scope: command.scope,
          key: command.key,
        },
      },
    });
    if (existing) {
      if (existing.requestHash !== command.hash)
        throw new ConflictException(
          'Idempotency key conflicts with another request.',
        );
      if (existing.responseBody)
        return existing.responseBody as unknown as QueueSnapshot;
      throw new ConflictException('Queue command is already in progress.');
    }
    await tx.idempotencyRecord.create({
      data: {
        actorId: access.actorId,
        scope: command.scope,
        key: command.key,
        requestHash: command.hash,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    return null;
  }
  private async finish(
    tx: Prisma.TransactionClient,
    access: QueueAccess,
    command: QueueCommand,
    snapshot: QueueSnapshot,
  ): Promise<QueueSnapshot> {
    await tx.idempotencyRecord.update({
      where: {
        actorId_scope_key: {
          actorId: access.actorId,
          scope: command.scope,
          key: command.key,
        },
      },
      data: {
        responseCode: 200,
        responseBody: this.replaySnapshot(
          snapshot,
        ) as unknown as Prisma.InputJsonValue,
      },
    });
    return snapshot;
  }
  private async record(
    tx: Prisma.TransactionClient,
    access: QueueAccess,
    session: SessionRow,
    entryId: string | null,
    action: string,
    requestId: string,
    now: Date,
  ) {
    try {
      await tx.queueActivity.create({
        data: {
          organizationId: session.organizationId,
          clinicId: session.clinicId,
          queueSessionId: session.id,
          queueEntryId: entryId,
          actorUserId: access.actorId,
          action,
          occurredAt: now,
        },
      });
      await tx.queueAudit.create({
        data: {
          organizationId: session.organizationId,
          clinicId: session.clinicId,
          queueSessionId: session.id,
          queueEntryId: entryId,
          actorUserId: access.actorId,
          action,
          requestId,
          metadata: { version: session.version },
          occurredAt: now,
        },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: session.organizationId,
          clinicId: session.clinicId,
          actorUserId: access.actorId,
          action,
          targetType: 'QueueSession',
          targetId: session.id,
          outcome: 'succeeded',
          requestId,
          metadata: { version: session.version },
          occurredAt: now,
        },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'QueueSession',
          aggregateId: session.id,
          eventType: action,
          payload: {
            organizationId: session.organizationId,
            clinicId: session.clinicId,
            queueSessionId: session.id,
            queueEntryId: entryId,
          },
          occurredAt: now,
        },
      });
    } catch {
      throw new ServiceUnavailableException(
        'Security audit is temporarily unavailable.',
      );
    }
  }
  private mapEntry(entry: SessionRow['entries'][number]): QueueEntryProjection {
    return Object.freeze({
      id: entry.id,
      appointmentId: entry.appointmentId,
      appointmentReference: entry.appointment.publicReference,
      patientProfileId: entry.patientProfileId,
      patientName: `${entry.patientRegistration.patientProfile.firstName} ${entry.patientRegistration.patientProfile.lastName}`,
      ticketNumber: entry.ticketNumber,
      status: entry.status,
      version: entry.version,
      calledAt: entry.calledAt?.toISOString() ?? null,
      consultationStartedAt: entry.consultationStartedAt?.toISOString() ?? null,
      completedAt: entry.completedAt?.toISOString() ?? null,
      noResponseAt: entry.noResponseAt?.toISOString() ?? null,
    });
  }
  private map(row: SessionRow): QueueSnapshot {
    const entries = row.entries.map((entry) => this.mapEntry(entry));
    return Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      clinic: row.clinic,
      doctor: {
        id: row.doctorAssignment.doctor.id,
        name: row.doctorAssignment.doctor.displayName,
      },
      operationalDate: row.operationalDate.toISOString().slice(0, 10),
      effectiveTimezone: row.effectiveTimezone,
      status: row.status,
      version: row.version,
      waitingCount: entries.filter((entry) => entry.status === 'waiting')
        .length,
      current:
        entries.find((entry) =>
          ['called', 'inConsultation'].includes(entry.status),
        ) ?? null,
      waiting: entries
        .filter((entry) => entry.status === 'waiting')
        .slice(0, 50),
      recentActivity: row.activities.map((activity) => ({
        action: activity.action,
        occurredAt: activity.occurredAt.toISOString(),
        ticketNumber: activity.queueEntry?.ticketNumber ?? null,
      })),
      openedAt: row.openedAt?.toISOString() ?? null,
      pausedAt: row.pausedAt?.toISOString() ?? null,
      closedAt: row.closedAt?.toISOString() ?? null,
      pauseReason: row.pauseReason,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  private replaySnapshot(snapshot: QueueSnapshot): QueueSnapshot {
    const redact = (entry: QueueEntryProjection): QueueEntryProjection => ({
      ...entry,
      id: '',
      appointmentId: '',
      patientProfileId: '',
      patientName: '',
    });
    return {
      ...snapshot,
      organizationId: '',
      current: snapshot.current ? redact(snapshot.current) : null,
      waiting: [],
      recentActivity: [],
    };
  }

  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.db.$transaction(work);
      } catch (error) {
        if (error instanceof AppointmentAuditPersistenceError)
          throw new ServiceUnavailableException(
            'Security audit is temporarily unavailable.',
          );
        const text = this.errorText(error);
        const retryable =
          text.includes('P2034') ||
          text.includes('40001') ||
          text.includes('40P01');
        if (retryable && attempt < 2) continue;
        if (retryable)
          throw new ServiceUnavailableException(
            'Queue operation could not be completed safely. Please retry.',
          );
        if (
          text.includes('23505') ||
          text.includes('23514') ||
          text.includes('recall') ||
          text.includes('unresolved')
        )
          throw new ConflictException(
            'Queue state changed or the operation is not available.',
          );
        throw error;
      }
    }
    throw new ServiceUnavailableException(
      'Queue operation could not be completed safely. Please retry.',
    );
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) {
      const structured = error as Error & {
        cause?: unknown;
        code?: unknown;
        meta?: unknown;
      };
      const code =
        typeof structured.code === 'string' ||
        typeof structured.code === 'number'
          ? structured.code
          : '';
      return `${structured.name} ${structured.message} ${code} ${JSON.stringify(
        structured.meta ?? '',
      )} ${this.errorText(structured.cause)}`;
    }
    return typeof error === 'string' ? error : '';
  }

  private decodeCursor(
    cursor: string,
    sessionId: string,
  ): { ticketNumber: number; id: string } {
    try {
      const [payload, signature, extra] = cursor.split('.');
      if (!payload || !signature || extra) throw new Error('invalid');
      if (!safeEqualHex(signature, this.signCursor(payload)))
        throw new Error('invalid');
      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { sessionId?: unknown; ticketNumber?: unknown; id?: unknown };
      if (
        parsed.sessionId !== sessionId ||
        !Number.isInteger(parsed.ticketNumber) ||
        (parsed.ticketNumber as number) < 1 ||
        typeof parsed.id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(parsed.id)
      )
        throw new Error('invalid');
      return {
        ticketNumber: parsed.ticketNumber as number,
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('Queue entry cursor is invalid.');
    }
  }

  private encodeCursor(value: {
    sessionId: string;
    ticketNumber: number;
    id: string;
  }): string {
    const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${payload}.${this.signCursor(payload)}`;
  }

  private signCursor(payload: string): string {
    return keyedHash(
      'queue-pagination-cursor',
      payload,
      this.configuration.auditHashSecret,
    );
  }
}
