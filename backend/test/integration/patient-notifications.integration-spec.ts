import { randomUUID } from 'node:crypto';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PrismaAppointmentRepository } from '../../src/modules/appointments/infrastructure/prisma-appointment.repository';
import { PatientReminderWorker } from '../../src/modules/notifications/infrastructure/patient-reminder.worker';
import {
  apiConfiguration,
  apiPrisma,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(20_000);

const HOUR = 3_600_000;

describe('patient visit notifications', () => {
  afterAll(() => apiPrisma.$disconnect());

  it('sends a day-before reminder once, then tells the patient when the clinic cancels', async () => {
    const seeded = await createSeededQueue(0);
    const now = new Date();
    const appointment = await apiPrisma.appointment.create({
      data: {
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
        doctorId: seeded.doctor.doctorId!,
        patientProfileId: seeded.profile.id,
        origin: 'patientBooked',
        startsAt: new Date(now.getTime() + 20 * HOUR),
        endsAt: new Date(now.getTime() + 20 * HOUR + 15 * 60_000),
        durationMinutes: 15,
        feeIqd: 25000,
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 72 * HOUR),
      },
    });
    await apiPrisma.appointmentArrival.create({
      data: {
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
        appointmentId: appointment.id,
        patientProfileId: seeded.profile.id,
      },
    });
    const worker = new PatientReminderWorker(
      { db: apiPrisma } as unknown as PrismaService,
      apiConfiguration,
    );
    await worker.processTick(now);
    await worker.processTick(now);
    const reminders = await apiPrisma.notificationRecord.findMany({
      where: {
        recipientUserId: seeded.patient.userId,
        type: 'appointment.reminder.day-before',
      },
    });
    expect(reminders).toHaveLength(1);
    expect(reminders[0]!.patientProfileId).toBe(seeded.profile.id);
    const context = (
      reminders[0]!.payload as { context: Record<string, unknown> }
    ).context;
    expect(context).toMatchObject({
      appointmentId: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
    });
    expect(typeof context.doctorName).toBe('string');
    expect(JSON.stringify(context)).not.toMatch(/phone|\+964|birth/i);

    const repository = new PrismaAppointmentRepository({
      db: apiPrisma,
    } as unknown as PrismaService);
    await repository.cancel(
      {
        actorId: seeded.manager.userId,
        patient: false,
        doctor: false,
        platformAdministrator: false,
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
      },
      appointment.id,
      'Doctor is away',
      appointment.version,
      randomUUID(),
      {
        key: randomUUID(),
        hash: 'h',
        scope: `appointment.cancel:${appointment.id}`,
        responseCode: 200,
      },
    );
    const cancelled = await apiPrisma.notificationRecord.findMany({
      where: {
        recipientUserId: seeded.patient.userId,
        type: 'appointment.cancelled.by-clinic',
      },
    });
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0]!.priority).toBe('high');
  });

  it('tells the first patients in an open queue that their turn is near, once each', async () => {
    const seeded = await createSeededQueue(4);
    const worker = new PatientReminderWorker(
      { db: apiPrisma } as unknown as PrismaService,
      apiConfiguration,
    );
    await worker.processTick();
    await worker.processTick();
    const entries = await apiPrisma.queueEntry.findMany({
      where: { queueSessionId: seeded.session.id },
      orderBy: { ticketNumber: 'asc' },
    });
    const almost = await apiPrisma.outboxEvent.findMany({
      where: {
        eventType: 'queue.patient.almost',
        aggregateId: { in: entries.map(({ id }) => id) },
      },
      include: { notifications: true },
    });
    // Three at most: nobody ahead, one ahead, two ahead.
    expect(almost.map(({ aggregateId }) => aggregateId).sort()).toEqual(
      entries
        .slice(0, 3)
        .map(({ id }) => id)
        .sort(),
    );
    const first = almost.find(
      ({ aggregateId }) => aggregateId === entries[0]!.id,
    )!;
    expect(first.notifications).toHaveLength(1);
    expect(
      (first.notifications[0]!.payload as { context: Record<string, unknown> })
        .context,
    ).toMatchObject({ ticketNumber: entries[0]!.ticketNumber, ahead: 0 });
  });
});
