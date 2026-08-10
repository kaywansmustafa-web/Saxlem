/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type IdentityRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';
import { PrismaAppointmentQueueCompletionPort } from '../../src/modules/appointments/infrastructure/prisma-appointment-queue-completion.port';
import { PrismaBillingRepository } from '../../src/modules/billing/infrastructure/prisma-billing.repository';
import type { QueueCommand } from '../../src/modules/queue/domain/queue';
import { PrismaQueueRepository } from '../../src/modules/queue/infrastructure/prisma-queue.repository';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';

export const apiDatabaseUrl = process.env.TEST_DATABASE_URL!;
export const apiPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: apiDatabaseUrl }),
});
export const apiConfiguration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'test',
  DATABASE_URL: apiDatabaseUrl,
  ACCESS_TOKEN_SECRET: 'queue-api-access-secret-32-characters',
  REFRESH_TOKEN_SECRET: 'queue-api-refresh-secret-32-characters',
  OTP_SECRET: 'queue-api-otp-secret-32-characters',
  AUDIT_HASH_SECRET: 'queue-api-audit-secret-32-characters',
  OPENAPI_ENABLED: 'true',
});

export async function createQueueApiApplication() {
  const app = await createApplication(apiConfiguration);
  await app.init();
  return app;
}

export async function createApiTenant(label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random()}`;
  const organization = await apiPrisma.organization.create({
    data: { name: `Queue API ${suffix}` },
  });
  const clinic = await apiPrisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: `Queue API Clinic ${label}`,
      code: `queue-api-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  return { organizationId: organization.id, clinicId: clinic.id };
}

export async function createSeededQueue(entryCount: number) {
  const tenant = await createApiTenant(`seeded-${entryCount}`);
  const doctor = await createRolePrincipal('doctor', tenant);
  const manager = await createRolePrincipal('clinicManager', tenant);
  const patient = await createRolePrincipal('patient', tenant);
  const patientAccount = await apiPrisma.patientAccount.findUniqueOrThrow({
    where: { userId: patient.userId },
  });
  const profile = await apiPrisma.patientProfile.create({
    data: {
      patientAccountId: patientAccount.id,
      firstName: 'Private',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'unspecified',
    },
  });
  await apiPrisma.organizationPatientProfile.create({
    data: {
      organizationId: tenant.organizationId,
      patientProfileId: profile.id,
    },
  });
  const marker = randomUUID();
  const start = Date.parse('2035-01-01T06:00:00Z');
  await apiPrisma.appointment.createMany({
    data: Array.from({ length: entryCount }, (_, index) => ({
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      doctorId: doctor.doctorId!,
      patientProfileId: profile.id,
      origin: 'patientBooked' as const,
      reason: `${marker}-${index}`,
      startsAt: new Date(start + index * 5 * 60_000),
      endsAt: new Date(start + (index * 5 + 5) * 60_000),
      durationMinutes: 5,
      feeIqd: 25000,
      status: 'confirmed' as const,
    })),
  });
  const appointments = await apiPrisma.appointment.findMany({
    where: { reason: { startsWith: marker } },
    orderBy: { startsAt: 'asc' },
  });
  await apiPrisma.appointmentArrival.createMany({
    data: appointments.map((appointment) => ({
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      appointmentId: appointment.id,
      patientProfileId: profile.id,
    })),
  });
  await apiPrisma.appointmentArrival.updateMany({
    where: { appointmentId: { in: appointments.map(({ id }) => id) } },
    data: {
      status: 'arrived',
      arrivedAt: new Date(),
      version: { increment: 1 },
    },
  });
  await apiPrisma.appointmentArrival.updateMany({
    where: { appointmentId: { in: appointments.map(({ id }) => id) } },
    data: {
      status: 'queueReady',
      queueReadyAt: new Date(),
      version: { increment: 1 },
    },
  });
  const repository = new PrismaQueueRepository(
    { db: apiPrisma } as unknown as PrismaService,
    new PrismaAppointmentQueueCompletionPort(
      new PrismaBillingRepository({
        db: apiPrisma,
      } as unknown as PrismaService),
    ),
    apiConfiguration,
  );
  const access = {
    actorId: manager.userId,
    patient: false,
    doctor: false,
    platformAdministrator: false,
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    capabilities: new Set<string>(),
  };
  let seededSession = await repository.open(
    access,
    tenant.clinicId,
    doctor.doctorId!,
    new Date('2035-01-01'),
    5,
    1,
    new Date('2035-01-01T05:30:00Z'),
    randomUUID(),
    apiCommand('seed-open', `queue.open:${tenant.clinicId}:${doctor.doctorId}`),
  );
  for (const [index, appointment] of appointments.entries()) {
    seededSession = await repository.enqueue(
      access,
      seededSession.id,
      appointment.id,
      seededSession.version,
      new Date('2035-01-01T05:45:00Z'),
      randomUUID(),
      apiCommand(`seed-entry-${index}`, `queue.enqueue:${seededSession.id}`),
    );
  }
  return {
    tenant,
    session: await apiPrisma.queueSession.findUniqueOrThrow({
      where: { id: seededSession.id },
    }),
    appointments,
    profile,
    manager,
    doctor,
    patient,
  };
}

function apiCommand(key: string, scope: string): QueueCommand {
  return {
    key,
    scope,
    hash: createHash('sha256').update(key).digest('hex'),
  };
}

export async function createRolePrincipal(
  role: IdentityRole,
  tenant: Awaited<ReturnType<typeof createApiTenant>>,
) {
  const suffix = `${role}-${Date.now()}-${Math.random()}`;
  const user = await apiPrisma.user.create({
    data: {
      ...(role === 'patient'
        ? {
            patientAccount: {
              create: {
                normalizedPhoneNumber: `+96475${Math.floor(
                  Math.random() * 1_000_000_000,
                )
                  .toString()
                  .padStart(9, '0')}`,
              },
            },
          }
        : {
            staffAccount: {
              create: { email: `${suffix.toLowerCase()}@example.invalid` },
            },
          }),
      roles: {
        create: {
          role,
          ...(role !== 'patient' && role !== 'platformAdministrator'
            ? {
                organizationId: tenant.organizationId,
                clinicId: tenant.clinicId,
              }
            : {}),
        },
      },
      ...(role !== 'patient'
        ? {
            memberships: {
              create: {
                role,
                organizationId: tenant.organizationId,
                clinicId: tenant.clinicId,
              },
            },
          }
        : {}),
    },
    include: { staffAccount: true },
  });
  let doctorId: string | null = null;
  if (role === 'doctor') {
    doctorId = await apiPrisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.create({
        data: {
          organizationId: tenant.organizationId,
          staffAccountId: user.staffAccount!.id,
          firstName: 'API',
          lastName: 'Doctor',
          displayName: 'Dr. API Doctor',
          gender: 'unspecified',
          licenseNumber: `API-${suffix}`,
          yearsOfExperience: 5,
          languages: ['english'],
        },
      });
      await tx.doctorClinicAssignment.create({
        data: {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          doctorId: doctor.id,
        },
      });
      return doctor.id;
    });
  }
  const family = await apiPrisma.sessionFamily.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 86_400_000),
      role,
      organizationId:
        role === 'patient' || role === 'platformAdministrator'
          ? null
          : tenant.organizationId,
      clinicId:
        role === 'patient' || role === 'platformAdministrator'
          ? null
          : tenant.clinicId,
    },
  });
  const session = await apiPrisma.refreshSession.create({
    data: {
      userId: user.id,
      familyId: family.id,
      deviceId: `queue-api-${role}`,
      platform: 'test',
      tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  const token = await new JwtService().signAsync(
    {
      sub: user.id,
      sid: session.id,
      jti: randomUUID(),
      typ: 'access',
      auth_time: Math.floor(Date.now() / 1000),
      av: user.authorizationVersion,
      rv: user.roleVersion,
      role,
      ...(role !== 'patient' && role !== 'platformAdministrator'
        ? { org: tenant.organizationId, clinic: tenant.clinicId }
        : {}),
    },
    {
      secret: apiConfiguration.accessTokenSecret,
      algorithm: 'HS256',
      expiresIn: '10m',
      issuer: 'saxlem',
      audience: 'saxlem-clients',
    },
  );
  return { userId: user.id, token, doctorId };
}

export async function apiSideEffects() {
  const [sessions, entries, activities, queueAudits, audits, outbox, commands] =
    await Promise.all([
      apiPrisma.queueSession.count(),
      apiPrisma.queueEntry.count(),
      apiPrisma.queueActivity.count(),
      apiPrisma.queueAudit.count(),
      apiPrisma.auditEvent.count(),
      apiPrisma.outboxEvent.count(),
      apiPrisma.idempotencyRecord.count(),
    ]);
  return {
    sessions,
    entries,
    activities,
    queueAudits,
    audits,
    outbox,
    commands,
  };
}

export function expectErrorEnvelope(body: unknown, status: number) {
  expect(body).toEqual({
    error: {
      code:
        status === 400
          ? expect.stringMatching(/VALIDATION_FAILED|REQUEST_REJECTED/)
          : status === 404
            ? 'RESOURCE_NOT_FOUND'
            : status >= 500
              ? 'INTERNAL_ERROR'
              : 'REQUEST_REJECTED',
      message: expect.any(String),
      requestId: expect.any(String),
      retryable: status >= 500,
      fieldErrors: expect.any(Array),
    },
  });
}
