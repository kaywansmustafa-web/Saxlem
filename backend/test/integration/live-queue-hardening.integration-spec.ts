import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { BackendConfiguration } from '../../src/config/environment';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PrismaAppointmentQueueCompletionPort } from '../../src/modules/appointments/infrastructure/prisma-appointment-queue-completion.port';
import { PrismaAppointmentRepository } from '../../src/modules/appointments/infrastructure/prisma-appointment.repository';
import type {
  QueueAccess,
  QueueCommand,
} from '../../src/modules/queue/domain/queue';
import { PrismaQueueRepository } from '../../src/modules/queue/infrastructure/prisma-queue.repository';
import { mapStaffQueue } from '../../src/modules/queue/presentation/queue-dto.mapper';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});
describe('live queue structural hardening', () => {
  afterAll(() => prisma.$disconnect());

  it('C1 serializes two eligible concurrent enqueues and allocates consecutive tickets without gaps', async () => {
    const fixture = await createFixture(2);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date('2031-01-01T05:30:00Z'),
      'open-request',
      command('queue-open-key', 'queue.open', {}),
    );
    const results = await Promise.allSettled(
      fixture.appointments.map((appointment, index) =>
        repository.enqueue(
          access,
          opened.id,
          appointment.id,
          2,
          new Date('2031-01-01T05:45:00Z'),
          `enqueue-${index}`,
          command(
            `enqueue-key-${index}`,
            `queue.enqueue:${opened.id}`,
            appointment,
          ),
        ),
      ),
    );
    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    const session = await prisma.queueSession.findUniqueOrThrow({
      where: { id: opened.id },
      include: { entries: { orderBy: { ticketNumber: 'asc' } } },
    });
    expect(session.nextTicket).toBe(3);
    expect(session.version).toBe(4);
    expect(session.entries.map((entry) => entry.ticketNumber)).toEqual([1, 2]);
    expect(
      new Set(session.entries.map((entry) => entry.ticketNumber)).size,
    ).toBe(2);
    const stored = await prisma.idempotencyRecord.findMany({
      where: { scope: `queue.enqueue:${opened.id}` },
      select: { responseBody: true },
    });
    expect(JSON.stringify(stored)).not.toMatch(
      /patientName|patientProfileId|appointmentId|waiting":\[\{/,
    );
  }, 30_000);

  it('enforces doctor organization and clinic scope for every repository resource query', async () => {
    const fixture = await createFixture(1);
    const repository = queueRepository();
    const opened = await repository.open(
      staffAccess(fixture),
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'scope-open',
      command('scope-open-key', 'queue.open', {}),
    );
    const foreignClinic = await prisma.clinic.create({
      data: {
        organizationId: fixture.organizationId,
        name: 'Foreign clinic',
        code: `foreign-${Date.now()}`,
        timezone: 'Asia/Baghdad',
      },
    });
    const doctorAccess: QueueAccess = {
      actorId: fixture.doctorUserId,
      patient: false,
      doctor: true,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      clinicId: foreignClinic.id,
      capabilities: new Set(['queue:read']),
    };
    await expect(repository.get(doctorAccess, opened.id)).resolves.toBeNull();
    await expect(
      repository.listEntries(doctorAccess, opened.id, 25),
    ).resolves.toBeNull();
    const before = await sideEffectCounts(opened.id);
    await expect(
      repository.getCurrent(
        doctorAccess,
        fixture.clinicId,
        fixture.doctorId,
        new Date(),
      ),
    ).resolves.toBeNull();
    await expect(
      repository.open(
        doctorAccess,
        fixture.clinicId,
        fixture.doctorId,
        new Date('2031-01-01'),
        5,
        2,
        new Date(),
        'foreign-open',
        command('foreign-open-key', 'queue.foreign.open', {}),
      ),
    ).rejects.toThrow();
    await expect(
      repository.enqueue(
        doctorAccess,
        opened.id,
        fixture.appointments[0]!.id,
        2,
        new Date(),
        'foreign-enqueue',
        command('foreign-enqueue-key', 'queue.foreign.enqueue', {}),
      ),
    ).rejects.toThrow();
    for (const operation of ['pause', 'resume', 'close'] as const)
      await expect(
        repository.transitionSession(
          doctorAccess,
          opened.id,
          operation,
          2,
          null,
          new Date(),
          `foreign-${operation}`,
          command(`foreign-${operation}-key`, `queue.foreign.${operation}`, {}),
        ),
      ).rejects.toThrow();
    await expect(
      repository.callNext(
        doctorAccess,
        opened.id,
        2,
        new Date(),
        'foreign-call',
        command('foreign-call-key', 'queue.foreign.call', {}),
      ),
    ).rejects.toThrow();
    for (const operation of [
      'recall',
      'no-response',
      'start',
      'complete',
    ] as const)
      await expect(
        repository.transitionEntry(
          doctorAccess,
          opened.id,
          '00000000-0000-0000-0000-000000000001',
          operation,
          2,
          1,
          {
            recallGraceMinutes: 5,
            busyThresholdMinutes: 10,
            delayedThresholdMinutes: 25,
            fallbackConsultationMinutes: 20,
          },
          new Date(),
          `foreign-${operation}`,
          command(
            `foreign-entry-${operation}-key`,
            `queue.foreign.entry.${operation}`,
            {},
          ),
        ),
      ).rejects.toThrow();
    expect(await sideEffectCounts(opened.id)).toEqual(before);
  });

  it('blocks direct lifecycle, ticket, unresolved-close, and history-scope bypasses', async () => {
    const fixture = await createFixture(1);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'invariant-open',
      command('invariant-open-key', 'queue.open', {}),
    );
    const queued = await repository.enqueue(
      access,
      opened.id,
      fixture.appointments[0]!.id,
      2,
      new Date(),
      'invariant-enqueue',
      command(
        'invariant-enqueue-key',
        `queue.enqueue:${opened.id}`,
        fixture.appointments[0]!,
      ),
    );
    const entry = await prisma.queueEntry.findFirstOrThrow({
      where: { queueSessionId: opened.id },
    });
    await expect(
      prisma.queueEntry.update({
        where: { id: entry.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          version: { increment: 1 },
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.queueSession.update({
        where: { id: opened.id },
        data: {
          status: 'closed',
          closedAt: new Date(),
          version: { increment: 1 },
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.queueSession.update({
        where: { id: opened.id },
        data: {
          nextTicket: queued.waitingCount + 50,
          version: { increment: 1 },
        },
      }),
    ).rejects.toThrow();
  });

  it('preserves an active session when the clinic timezone changes', async () => {
    const fixture = await createFixture(1);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date('2031-01-01T21:30:00Z'),
      'timezone-open',
      command('timezone-open-key', 'queue.open', {}),
    );
    await prisma.clinic.update({
      where: { id: fixture.clinicId },
      data: { timezone: 'Pacific/Kiritimati' },
    });
    const current = await repository.getCurrent(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-02'),
    );
    expect(current?.id).toBe(opened.id);
    expect(current?.effectiveTimezone).toBe('Asia/Baghdad');
  });

  it('paginates more than fifty entries without omissions and rejects foreign cursors', async () => {
    const fixture = await createFixture(52);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'page-open',
      command('page-open-key', 'queue.open', {}),
    );
    let version = 2;
    for (const [index, appointment] of fixture.appointments.entries()) {
      await repository.enqueue(
        access,
        opened.id,
        appointment.id,
        version,
        new Date(),
        `page-enqueue-${index}`,
        command(
          `page-enqueue-key-${index}`,
          `queue.enqueue:${opened.id}`,
          appointment,
        ),
      );
      version += 1;
    }
    const first = await repository.listEntries(access, opened.id, 25);
    const second = await repository.listEntries(
      access,
      opened.id,
      25,
      first!.nextCursor!,
    );
    const third = await repository.listEntries(
      access,
      opened.id,
      25,
      second!.nextCursor!,
    );
    const tickets = [...first!.items, ...second!.items, ...third!.items].map(
      (entry) => entry.ticketNumber,
    );
    expect(tickets).toEqual(
      Array.from({ length: 52 }, (_, index) => index + 1),
    );
    expect(new Set(tickets).size).toBe(52);
    await expect(
      repository.listEntries(
        access,
        opened.id,
        25,
        Buffer.from(
          JSON.stringify({
            sessionId: '00000000-0000-0000-0000-000000000001',
            ticketNumber: 25,
            id: first!.items.at(-1)!.id,
          }),
        ).toString('base64url'),
      ),
    ).rejects.toThrow('cursor is invalid');
  }, 60_000);

  it('C2 rejects concurrent duplicate appointment enqueue with different keys without a ticket gap', async () => {
    const fixture = await createFixture(1);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'c2-open',
      command('c2-open-key', 'queue.open:c2', {}),
    );
    const results = await Promise.allSettled(
      ['c2-enqueue-a', 'c2-enqueue-b'].map((key) =>
        repository.enqueue(
          access,
          opened.id,
          fixture.appointments[0]!.id,
          opened.version,
          new Date(),
          key,
          command(key, `queue.enqueue:${opened.id}`, { appointment: 'same' }),
        ),
      ),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const session = await prisma.queueSession.findUniqueOrThrow({
      where: { id: opened.id },
      include: { entries: true },
    });
    expect({
      entries: session.entries.length,
      tickets: session.entries.map((entry) => entry.ticketNumber),
      nextTicket: session.nextTicket,
      version: session.version,
    }).toEqual({ entries: 1, tickets: [1], nextTicket: 2, version: 3 });
  });

  it('C3 rejects concurrent duplicate-arrival enqueue and commits one entry only', async () => {
    const fixture = await createFixture(1);
    const arrival = await prisma.appointmentArrival.findUniqueOrThrow({
      where: { appointmentId: fixture.appointments[0]!.id },
    });
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'c3-open',
      command('c3-open-key', 'queue.open:c3', {}),
    );
    const settled = await Promise.allSettled(
      ['c3-arrival-a', 'c3-arrival-b'].map((key) =>
        repository.enqueue(
          access,
          opened.id,
          fixture.appointments[0]!.id,
          opened.version,
          new Date(),
          key,
          command(key, `queue.enqueue:${opened.id}`, { arrivalId: arrival.id }),
        ),
      ),
    );
    expect(settled.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(
      await prisma.queueEntry.count({ where: { arrivalId: arrival.id } }),
    ).toBe(1);
  });

  it('C4 serializes simultaneous Call Next and creates exactly one current patient', async () => {
    const { repository, access, snapshot } = await createQueuedFixture(2);
    const before = await prisma.queueActivity.count({
      where: { queueSessionId: snapshot.id, action: 'queue.patient.called' },
    });
    const settled = await Promise.allSettled(
      ['c4-call-a', 'c4-call-b'].map((key) =>
        repository.callNext(
          access,
          snapshot.id,
          snapshot.version,
          new Date(),
          key,
          command(key, `queue.call-next:${snapshot.id}`, {}),
        ),
      ),
    );
    expect(settled.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    const row = await prisma.queueSession.findUniqueOrThrow({
      where: { id: snapshot.id },
      include: { entries: { orderBy: { ticketNumber: 'asc' } } },
    });
    expect(
      row.entries.filter((entry) => entry.status === 'called'),
    ).toHaveLength(1);
    expect(row.entries[0]!.status).toBe('called');
    expect(row.version).toBe(snapshot.version + 1);
    expect(
      await prisma.queueActivity.count({
        where: { queueSessionId: snapshot.id, action: 'queue.patient.called' },
      }),
    ).toBe(before + 1);
  });

  it('C5 permits only serialized Call Next versus Pause outcomes', async () => {
    const { repository, access, snapshot } = await createQueuedFixture(1);
    const settled = await Promise.allSettled([
      repository.callNext(
        access,
        snapshot.id,
        snapshot.version,
        new Date(),
        'c5-call-key',
        command('c5-call-key', `queue.call-next:${snapshot.id}`, {}),
      ),
      repository.transitionSession(
        access,
        snapshot.id,
        'pause',
        snapshot.version,
        'Operational pause',
        new Date(),
        'c5-pause',
        command('c5-pause-key', `queue.pause:${snapshot.id}`, {}),
      ),
    ]);
    expect(
      settled.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const row = await prisma.queueSession.findUniqueOrThrow({
      where: { id: snapshot.id },
      include: { entries: true },
    });
    const current = row.entries.filter((entry) =>
      ['called', 'inConsultation'].includes(entry.status),
    );
    expect(
      (row.status === 'paused' && current.length === 0) ||
        (row.status === 'open' && current.length === 1),
    ).toBe(true);
  });

  it('C6 never closes a queue with unresolved work during Call Next versus Close', async () => {
    const { repository, access, snapshot } = await createQueuedFixture(1);
    await Promise.allSettled([
      repository.callNext(
        access,
        snapshot.id,
        snapshot.version,
        new Date(),
        'c6-call-key',
        command('c6-call-key', `queue.call-next:${snapshot.id}`, {}),
      ),
      repository.transitionSession(
        access,
        snapshot.id,
        'close',
        snapshot.version,
        null,
        new Date(),
        'c6-close',
        command('c6-close-key', `queue.close:${snapshot.id}`, {}),
      ),
    ]);
    const row = await prisma.queueSession.findUniqueOrThrow({
      where: { id: snapshot.id },
      include: { entries: true },
    });
    expect(
      row.status === 'closed' &&
        row.entries.some((entry) =>
          ['waiting', 'called', 'inConsultation'].includes(entry.status),
        ),
    ).toBe(false);
  });

  it('C7 serializes Enqueue versus Close without a closed queue containing waiting work', async () => {
    const fixture = await createFixture(1);
    const repository = queueRepository();
    const access = staffAccess(fixture);
    const opened = await repository.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'c7-open',
      command('c7-open-key', 'queue.open:c7', {}),
    );
    const settled = await Promise.allSettled([
      repository.enqueue(
        access,
        opened.id,
        fixture.appointments[0]!.id,
        opened.version,
        new Date(),
        'c7-enqueue',
        command('c7-enqueue-key', `queue.enqueue:${opened.id}`, {}),
      ),
      repository.transitionSession(
        access,
        opened.id,
        'close',
        opened.version,
        null,
        new Date(),
        'c7-close',
        command('c7-close-key', `queue.close:${opened.id}`, {}),
      ),
    ]);
    expect(
      settled.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const row = await prisma.queueSession.findUniqueOrThrow({
      where: { id: opened.id },
      include: { entries: true },
    });
    expect(row.status === 'closed' && row.entries.length > 0).toBe(false);
  });

  it('C8 — Complete versus No Response', async () => {
    const setup = await currentFixture('inConsultation');
    const before = await certificationState(setup.snapshot.id);
    const results = await Promise.allSettled([
      entryCommand(setup, 'complete', 'c8-complete'),
      entryCommand(setup, 'no-response', 'c8-no-response'),
    ]);
    expectStatuses(results, 1, 1);
    const state = await certificationState(setup.snapshot.id);
    expect(state.entryStatuses).toEqual(['completed']);
    expect(state.currentCount).toBe(0);
    expect(state.appointmentStatus).toBe('completed');
    expect(state.appointmentVersion).toBe(before.appointmentVersion + 1);
    expect(state.sessionVersion).toBe(before.sessionVersion + 1);
    expect(state.appointmentEvents).toBe(before.appointmentEvents + 1);
    expect(state.appointmentAudits).toBe(before.appointmentAudits + 1);
    expect(state.activities).toBe(before.activities + 1);
    expect(state.queueAudits).toBe(before.queueAudits + 1);
    expect(state.idempotencySuccess).toBe(before.idempotencySuccess + 1);
  });

  it('C9 — Start Consultation versus No Response', async () => {
    const setup = await currentFixture('called');
    const before = await certificationState(setup.snapshot.id);
    const results = await Promise.allSettled([
      entryCommand(setup, 'start', 'c9-start'),
      entryCommand(setup, 'no-response', 'c9-no-response'),
    ]);
    expectStatuses(results, 1, 1);
    const state = await certificationState(setup.snapshot.id);
    expect(
      state.entryStatuses[0] === 'inConsultation' ||
        state.entryStatuses[0] === 'noResponse',
    ).toBe(true);
    expect(state.currentCount).toBe(
      state.entryStatuses[0] === 'inConsultation' ? 1 : 0,
    );
    expect(state.sessionVersion).toBe(before.sessionVersion + 1);
    expect(state.activities).toBe(before.activities + 1);
    expect(state.queueAudits).toBe(before.queueAudits + 1);
    expect(state.idempotencySuccess).toBe(before.idempotencySuccess + 1);
  });

  it('C10 — Recall versus Call Next', async () => {
    const setup = await currentFixture('noResponse', 2);
    const target = await prisma.queueEntry.findFirstOrThrow({
      where: { queueSessionId: setup.snapshot.id, status: 'noResponse' },
    });
    const before = await certificationState(setup.snapshot.id);
    const results = await Promise.allSettled([
      entryCommand(setup, 'recall', 'c10-recall', target.id, target.version),
      setup.repository.callNext(
        setup.access,
        setup.snapshot.id,
        setup.snapshot.version,
        new Date(),
        'c10-call-next',
        command('c10-call-next', `queue.call-next:${setup.snapshot.id}`, {}),
      ),
    ]);
    expectStatuses(results, 1, 1);
    const rows = await prisma.queueEntry.findMany({
      where: { queueSessionId: setup.snapshot.id },
      orderBy: { ticketNumber: 'asc' },
    });
    expect(
      rows.filter((entry) =>
        ['called', 'inConsultation'].includes(entry.status),
      ),
    ).toHaveLength(1);
    expect(rows[0]!.ticketNumber).toBe(target.ticketNumber);
    const state = await certificationState(setup.snapshot.id);
    expect(state.sessionVersion).toBe(before.sessionVersion + 1);
    expect(state.activities).toBe(before.activities + 1);
  });

  it('C11 — Duplicate Recall', async () => {
    const setup = await currentFixture('noResponse');
    const entry = await activeEntry(setup.snapshot.id);
    const before = await certificationState(setup.snapshot.id);
    const results = await Promise.allSettled([
      entryCommand(setup, 'recall', 'c11-recall-a'),
      entryCommand(setup, 'recall', 'c11-recall-b'),
    ]);
    expectStatuses(results, 1, 1);
    const after = await activeEntry(setup.snapshot.id);
    expect(after.status).toBe('called');
    expect(after.ticketNumber).toBe(entry.ticketNumber);
    const state = await certificationState(setup.snapshot.id);
    expect(state.sessionVersion).toBe(before.sessionVersion + 1);
    expect(state.activities).toBe(before.activities + 1);
    expect(state.idempotencySuccess).toBe(before.idempotencySuccess + 1);
  });

  it('C12 — Duplicate Complete', async () => {
    const setup = await currentFixture('inConsultation');
    const before = await certificationState(setup.snapshot.id);
    const results = await Promise.allSettled([
      entryCommand(setup, 'complete', 'c12-complete-a'),
      entryCommand(setup, 'complete', 'c12-complete-b'),
    ]);
    expectStatuses(results, 1, 1);
    const state = await certificationState(setup.snapshot.id);
    expect(state.entryStatuses).toEqual(['completed']);
    expect(state.appointmentStatus).toBe('completed');
    expect(state.appointmentVersion).toBe(before.appointmentVersion + 1);
    expect(state.sessionVersion).toBe(before.sessionVersion + 1);
    expect(state.appointmentEvents).toBe(before.appointmentEvents + 1);
    expect(state.appointmentAudits).toBe(before.appointmentAudits + 1);
    expect(state.activities).toBe(before.activities + 1);
    expect(state.queueAudits).toBe(before.queueAudits + 1);
  });

  it('C13 — Stale expected version and commutative enqueue semantics', async () => {
    const setup = await createQueuedFixture(2);
    const staleVersion = setup.snapshot.version;
    const called = await setup.repository.callNext(
      setup.access,
      setup.snapshot.id,
      staleVersion,
      new Date(),
      'c13-call',
      command('c13-call-key', `queue.call-next:${setup.snapshot.id}`, {}),
    );
    const before = await certificationState(setup.snapshot.id);
    await expect(
      setup.repository.transitionSession(
        setup.access,
        setup.snapshot.id,
        'pause',
        staleVersion,
        null,
        new Date(),
        'c13-stale',
        command('c13-stale-key', `queue.pause:${setup.snapshot.id}`, {}),
      ),
    ).rejects.toThrow('stale');
    expect(await certificationState(setup.snapshot.id)).toEqual(before);
    expect(called.version).toBe(staleVersion + 1);

    const openSetup = await openFixture(0);
    const openBefore = await certificationState(openSetup.snapshot.id);
    await expect(
      openSetup.repository.open(
        openSetup.access,
        openSetup.fixture.clinicId,
        openSetup.fixture.doctorId,
        new Date('2031-01-01'),
        5,
        openSetup.snapshot.version - 1,
        new Date(),
        'c13-stale-open',
        command('c13-stale-open-key', 'queue.open:c13-stale', {}),
      ),
    ).rejects.toThrow('stale');
    expect(await certificationState(openSetup.snapshot.id)).toEqual(openBefore);

    const resumeSetup = await openFixture(2);
    let resumeSnapshot = await resumeSetup.repository.enqueue(
      resumeSetup.access,
      resumeSetup.snapshot.id,
      resumeSetup.fixture.appointments[0]!.id,
      resumeSetup.snapshot.version,
      new Date(),
      'c13-resume-enqueue-a',
      command(
        'c13-resume-enqueue-a-key',
        `queue.enqueue:${resumeSetup.snapshot.id}`,
        { appointment: 0 },
      ),
    );
    resumeSnapshot = await resumeSetup.repository.transitionSession(
      resumeSetup.access,
      resumeSetup.snapshot.id,
      'pause',
      resumeSnapshot.version,
      null,
      new Date(),
      'c13-pause-for-resume',
      command(
        'c13-pause-for-resume-key',
        `queue.pause:${resumeSetup.snapshot.id}`,
        {},
      ),
    );
    const staleResumeVersion = resumeSnapshot.version;
    await resumeSetup.repository.enqueue(
      resumeSetup.access,
      resumeSetup.snapshot.id,
      resumeSetup.fixture.appointments[1]!.id,
      staleResumeVersion,
      new Date(),
      'c13-resume-enqueue-b',
      command(
        'c13-resume-enqueue-b-key',
        `queue.enqueue:${resumeSetup.snapshot.id}`,
        { appointment: 1 },
      ),
    );
    const resumeBefore = await certificationState(resumeSetup.snapshot.id);
    await expect(
      resumeSetup.repository.transitionSession(
        resumeSetup.access,
        resumeSetup.snapshot.id,
        'resume',
        staleResumeVersion,
        null,
        new Date(),
        'c13-stale-resume',
        command(
          'c13-stale-resume-key',
          `queue.resume:${resumeSetup.snapshot.id}`,
          {},
        ),
      ),
    ).rejects.toThrow('stale');
    expect(await certificationState(resumeSetup.snapshot.id)).toEqual(
      resumeBefore,
    );

    const closeSetup = await openFixture(0);
    const pausedForClose = await closeSetup.repository.transitionSession(
      closeSetup.access,
      closeSetup.snapshot.id,
      'pause',
      closeSetup.snapshot.version,
      null,
      new Date(),
      'c13-close-pause',
      command(
        'c13-close-pause-key',
        `queue.pause:${closeSetup.snapshot.id}`,
        {},
      ),
    );
    await closeSetup.repository.transitionSession(
      closeSetup.access,
      closeSetup.snapshot.id,
      'resume',
      pausedForClose.version,
      null,
      new Date(),
      'c13-close-resume',
      command(
        'c13-close-resume-key',
        `queue.resume:${closeSetup.snapshot.id}`,
        {},
      ),
    );
    const closeBefore = await certificationState(closeSetup.snapshot.id);
    await expect(
      closeSetup.repository.transitionSession(
        closeSetup.access,
        closeSetup.snapshot.id,
        'close',
        pausedForClose.version,
        null,
        new Date(),
        'c13-stale-close',
        command(
          'c13-stale-close-key',
          `queue.close:${closeSetup.snapshot.id}`,
          {},
        ),
      ),
    ).rejects.toThrow('stale');
    expect(await certificationState(closeSetup.snapshot.id)).toEqual(
      closeBefore,
    );

    const callSetup = await openFixture(2);
    const callFirst = await callSetup.repository.enqueue(
      callSetup.access,
      callSetup.snapshot.id,
      callSetup.fixture.appointments[0]!.id,
      callSetup.snapshot.version,
      new Date(),
      'c13-call-enqueue-a',
      command(
        'c13-call-enqueue-a-key',
        `queue.enqueue:${callSetup.snapshot.id}`,
        { appointment: 0 },
      ),
    );
    await callSetup.repository.enqueue(
      callSetup.access,
      callSetup.snapshot.id,
      callSetup.fixture.appointments[1]!.id,
      callFirst.version,
      new Date(),
      'c13-call-enqueue-b',
      command(
        'c13-call-enqueue-b-key',
        `queue.enqueue:${callSetup.snapshot.id}`,
        { appointment: 1 },
      ),
    );
    const callBefore = await certificationState(callSetup.snapshot.id);
    await expect(
      callSetup.repository.callNext(
        callSetup.access,
        callSetup.snapshot.id,
        callFirst.version,
        new Date(),
        'c13-stale-call',
        command(
          'c13-stale-call-key',
          `queue.call-next:${callSetup.snapshot.id}`,
          {},
        ),
      ),
    ).rejects.toThrow('stale');
    expect(await certificationState(callSetup.snapshot.id)).toEqual(callBefore);

    for (const [target, operation] of [
      ['called', 'no-response'],
      ['called', 'start'],
      ['noResponse', 'recall'],
      ['inConsultation', 'complete'],
    ] as const) {
      await expectStaleEntryCommand(target, operation);
    }

    const independent = await createFixture(2);
    const repository = queueRepository();
    const access = staffAccess(independent);
    const opened = await repository.open(
      access,
      independent.clinicId,
      independent.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'c13-open',
      command('c13-open-key', 'queue.open:c13', {}),
    );
    const enqueues = await Promise.all(
      independent.appointments.map((appointment, index) =>
        repository.enqueue(
          access,
          opened.id,
          appointment.id,
          opened.version,
          new Date(),
          `c13-enqueue-${index}`,
          command(
            `c13-enqueue-key-${index}`,
            `queue.enqueue:${opened.id}`,
            appointment,
          ),
        ),
      ),
    );
    expect(enqueues.map((result) => result.version).sort()).toEqual([
      opened.version + 1,
      opened.version + 2,
    ]);
  });

  it('C14 — Simultaneous identical same-key replay', async () => {
    const enqueueSetup = await openFixture(1);
    const enqueueKey = 'c14-enqueue-same-key';
    const enqueueOperation = () =>
      enqueueSetup.repository.enqueue(
        enqueueSetup.access,
        enqueueSetup.snapshot.id,
        enqueueSetup.fixture.appointments[0]!.id,
        enqueueSetup.snapshot.version,
        new Date('2031-01-01T05:45:00Z'),
        'c14-enqueue-request',
        command(enqueueKey, `queue.enqueue:${enqueueSetup.snapshot.id}`, {
          appointmentId: enqueueSetup.fixture.appointments[0]!.id,
          version: enqueueSetup.snapshot.version,
        }),
      );
    const enqueueResults = await Promise.all([
      enqueueOperation(),
      enqueueOperation(),
    ]);
    expect(mapStaffQueue(enqueueResults[1])).toEqual(
      mapStaffQueue(enqueueResults[0]),
    );
    const enqueueState = await certificationState(enqueueSetup.snapshot.id);
    expect(enqueueState.entryCount).toBe(1);
    expect(enqueueState.sessionVersion).toBe(enqueueSetup.snapshot.version + 1);

    const setup = await createQueuedFixture(1);
    const key = 'c14-call-same-key';
    const operation = () =>
      setup.repository.callNext(
        setup.access,
        setup.snapshot.id,
        setup.snapshot.version,
        new Date('2031-01-01T06:00:00Z'),
        'c14-request',
        command(key, `queue.call-next:${setup.snapshot.id}`, {
          version: setup.snapshot.version,
        }),
      );
    const [first, second] = await Promise.all([operation(), operation()]);
    expect(mapStaffQueue(second)).toEqual(mapStaffQueue(first));
    const state = await certificationState(setup.snapshot.id);
    expect(state.activities).toBe(3);
    expect(state.queueAudits).toBe(3);
    expect(state.idempotencySuccess).toBe(2);
    expect(state.sessionVersion).toBe(4);

    const completeSetup = await currentFixture('inConsultation');
    const completeEntry = await activeEntry(completeSetup.snapshot.id);
    const completeKey = 'c14-complete-same-key';
    const completeOperation = () =>
      completeSetup.repository.transitionEntry(
        completeSetup.access,
        completeSetup.snapshot.id,
        completeEntry.id,
        'complete',
        completeSetup.snapshot.version,
        completeEntry.version,
        {
          recallGraceMinutes: 5,
          busyThresholdMinutes: 10,
          delayedThresholdMinutes: 25,
          fallbackConsultationMinutes: 20,
        },
        new Date(),
        'c14-complete-request',
        command(
          completeKey,
          `queue.complete:${completeSetup.snapshot.id}:${completeEntry.id}`,
          {
            sessionVersion: completeSetup.snapshot.version,
            entryVersion: completeEntry.version,
          },
        ),
      );
    const completeResults = await Promise.all([
      completeOperation(),
      completeOperation(),
    ]);
    expect(mapStaffQueue(completeResults[1])).toEqual(
      mapStaffQueue(completeResults[0]),
    );
    const completeState = await certificationState(completeSetup.snapshot.id);
    expect(completeState.entryStatuses).toEqual(['completed']);
    expect(completeState.appointmentEvents).toBe(1);
    expect(completeState.appointmentAudits).toBe(1);
  });

  it('C15 — Conflicting idempotency-key reuse', async () => {
    const setup = await createQueuedFixture(1);
    const key = 'c15-conflicting-key';
    await setup.repository.transitionSession(
      setup.access,
      setup.snapshot.id,
      'pause',
      setup.snapshot.version,
      'First reason',
      new Date(),
      'c15-first',
      command(key, `queue.pause:${setup.snapshot.id}`, {
        reason: 'First reason',
        version: setup.snapshot.version,
      }),
    );
    const before = await certificationState(setup.snapshot.id);
    await expect(
      setup.repository.transitionSession(
        setup.access,
        setup.snapshot.id,
        'pause',
        setup.snapshot.version,
        'Changed reason',
        new Date(),
        'c15-second',
        command(key, `queue.pause:${setup.snapshot.id}`, {
          reason: 'Changed reason',
          version: setup.snapshot.version,
        }),
      ),
    ).rejects.toThrow('conflicts');
    expect(await certificationState(setup.snapshot.id)).toEqual(before);

    const versionSetup = await createQueuedFixture(1);
    const versionKey = 'c15-version-key';
    await versionSetup.repository.transitionSession(
      versionSetup.access,
      versionSetup.snapshot.id,
      'pause',
      versionSetup.snapshot.version,
      null,
      new Date(),
      'c15-version-first',
      command(versionKey, `queue.pause:${versionSetup.snapshot.id}`, {
        version: versionSetup.snapshot.version,
      }),
    );
    const versionBefore = await certificationState(versionSetup.snapshot.id);
    await expect(
      versionSetup.repository.transitionSession(
        versionSetup.access,
        versionSetup.snapshot.id,
        'pause',
        versionSetup.snapshot.version + 1,
        null,
        new Date(),
        'c15-version-second',
        command(versionKey, `queue.pause:${versionSetup.snapshot.id}`, {
          version: versionSetup.snapshot.version + 1,
        }),
      ),
    ).rejects.toThrow('conflicts');
    expect(await certificationState(versionSetup.snapshot.id)).toEqual(
      versionBefore,
    );

    const appointmentSetup = await openFixture(2);
    const appointmentKey = 'c15-appointment-key';
    await appointmentSetup.repository.enqueue(
      appointmentSetup.access,
      appointmentSetup.snapshot.id,
      appointmentSetup.fixture.appointments[0]!.id,
      appointmentSetup.snapshot.version,
      new Date(),
      'c15-appointment-first',
      command(appointmentKey, `queue.enqueue:${appointmentSetup.snapshot.id}`, {
        appointmentId: appointmentSetup.fixture.appointments[0]!.id,
      }),
    );
    const appointmentBefore = await certificationState(
      appointmentSetup.snapshot.id,
    );
    await expect(
      appointmentSetup.repository.enqueue(
        appointmentSetup.access,
        appointmentSetup.snapshot.id,
        appointmentSetup.fixture.appointments[1]!.id,
        appointmentSetup.snapshot.version,
        new Date(),
        'c15-appointment-second',
        command(
          appointmentKey,
          `queue.enqueue:${appointmentSetup.snapshot.id}`,
          { appointmentId: appointmentSetup.fixture.appointments[1]!.id },
        ),
      ),
    ).rejects.toThrow('conflicts');
    expect(await certificationState(appointmentSetup.snapshot.id)).toEqual(
      appointmentBefore,
    );

    const targetSetup = await currentFixture('called', 2);
    const entries = await prisma.queueEntry.findMany({
      where: { queueSessionId: targetSetup.snapshot.id },
      orderBy: { ticketNumber: 'asc' },
    });
    const targetKey = 'c15-target-key';
    const targetScope = `queue.entry:${targetSetup.snapshot.id}`;
    await targetSetup.repository.transitionEntry(
      targetSetup.access,
      targetSetup.snapshot.id,
      entries[0]!.id,
      'no-response',
      targetSetup.snapshot.version,
      entries[0]!.version,
      {
        recallGraceMinutes: 5,
        busyThresholdMinutes: 10,
        delayedThresholdMinutes: 25,
        fallbackConsultationMinutes: 20,
      },
      new Date(),
      'c15-target-first',
      command(targetKey, targetScope, { entryId: entries[0]!.id }),
    );
    const targetBefore = await certificationState(targetSetup.snapshot.id);
    await expect(
      targetSetup.repository.transitionEntry(
        targetSetup.access,
        targetSetup.snapshot.id,
        entries[1]!.id,
        'no-response',
        targetSetup.snapshot.version + 1,
        entries[1]!.version,
        {
          recallGraceMinutes: 5,
          busyThresholdMinutes: 10,
          delayedThresholdMinutes: 25,
          fallbackConsultationMinutes: 20,
        },
        new Date(),
        'c15-target-second',
        command(targetKey, targetScope, { entryId: entries[1]!.id }),
      ),
    ).rejects.toThrow('conflicts');
    expect(await certificationState(targetSetup.snapshot.id)).toEqual(
      targetBefore,
    );
  });

  it('C16 — Appointment Cancellation versus Enqueue', async () => {
    const fixture = await createFixture(1);
    const queue = queueRepository();
    const access = staffAccess(fixture);
    const opened = await queue.open(
      access,
      fixture.clinicId,
      fixture.doctorId,
      new Date('2031-01-01'),
      5,
      1,
      new Date(),
      'c16-open',
      command('c16-open-key', 'queue.open:c16', {}),
    );
    const appointmentId = fixture.appointments[0]!.id;
    const appointments = new PrismaAppointmentRepository({
      db: prisma,
    } as unknown as PrismaService);
    const appointmentAccess = {
      actorId: fixture.staffUserId,
      patient: false,
      doctor: false,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
    };
    const results = await Promise.allSettled([
      queue.enqueue(
        access,
        opened.id,
        appointmentId,
        opened.version,
        new Date(),
        'c16-enqueue',
        command('c16-enqueue-key', `queue.enqueue:${opened.id}`, {}),
      ),
      appointments.cancel(
        appointmentAccess,
        appointmentId,
        'Certification cancellation',
        1,
        'c16-cancel',
        {
          key: 'c16-cancel-key',
          scope: `appointment.cancel:${appointmentId}`,
          hash: 'c16-cancel-hash',
          responseCode: 200,
        },
      ),
    ]);
    expectStatuses(results, 1, 1);
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
    });
    const entries = await prisma.queueEntry.findMany({
      where: { queueSessionId: opened.id },
    });
    expect(
      appointment.status === 'cancelled' ||
        (appointment.status === 'confirmed' && entries.length === 1),
    ).toBe(true);
    expect(appointment.status === 'cancelled' && entries.length > 0).toBe(
      false,
    );
  });

  it('C17 — Organization Deactivation versus Enqueue', async () => {
    await expectParticipantRace('organization');
  });

  it('C18 — Clinic Deactivation versus Enqueue', async () => {
    await expectParticipantRace('clinic');
  });

  it('C19 — Doctor Deactivation versus Enqueue', async () => {
    await expectParticipantRace('doctor');
  });

  it('C20 — Assignment Deactivation versus Enqueue', async () => {
    await expectParticipantRace('assignment');
  });

  it('C21 — Patient Deactivation versus Enqueue', async () => {
    await expectParticipantRace('patient');
  });

  it('C22 — Queue Audit Failure Rollback', async () => {
    await installFailureTrigger(
      'queue_audits',
      'c22_queue_audit_failure',
      "NEW.request_id LIKE 'c22-%'",
      '40001',
    );
    try {
      for (const operation of ['enqueue', 'call-next', 'pause'] as const) {
        const setup =
          operation === 'enqueue'
            ? await openFixture(1)
            : await createQueuedFixture(1);
        const before = await certificationState(setup.snapshot.id);
        const execute =
          operation === 'enqueue'
            ? setup.repository.enqueue(
                setup.access,
                setup.snapshot.id,
                setup.fixture.appointments[0]!.id,
                setup.snapshot.version,
                new Date(),
                `c22-${operation}`,
                command(
                  `c22-${operation}-key`,
                  `queue.enqueue:${setup.snapshot.id}`,
                  {},
                ),
              )
            : operation === 'call-next'
              ? setup.repository.callNext(
                  setup.access,
                  setup.snapshot.id,
                  setup.snapshot.version,
                  new Date(),
                  `c22-${operation}`,
                  command(
                    `c22-${operation}-key`,
                    `queue.call-next:${setup.snapshot.id}`,
                    {},
                  ),
                )
              : setup.repository.transitionSession(
                  setup.access,
                  setup.snapshot.id,
                  'pause',
                  setup.snapshot.version,
                  null,
                  new Date(),
                  `c22-${operation}`,
                  command(
                    `c22-${operation}-key`,
                    `queue.pause:${setup.snapshot.id}`,
                    {},
                  ),
                );
        await expect(execute).rejects.toThrow(
          'Security audit is temporarily unavailable.',
        );
        expect(await certificationState(setup.snapshot.id)).toEqual(before);
      }
    } finally {
      await removeFailureTrigger('queue_audits', 'c22_queue_audit_failure');
    }
  });

  it('C23 — Appointment Audit Failure Rollback', async () => {
    const setup = await currentFixture('inConsultation');
    const before = await certificationState(setup.snapshot.id);
    await installFailureTrigger(
      'audit_events',
      'c23_appointment_audit_failure',
      "NEW.request_id = 'c23-complete-request' AND NEW.target_type = 'Appointment'",
      '40001',
    );
    try {
      await expect(
        entryCommand(setup, 'complete', 'c23-complete'),
      ).rejects.toThrow('Security audit is temporarily unavailable.');
      expect(await certificationState(setup.snapshot.id)).toEqual(before);
    } finally {
      await removeFailureTrigger(
        'audit_events',
        'c23_appointment_audit_failure',
      );
    }
  });

  it('C24 — Real Serialization Retry and Exhaustion', async () => {
    const retry = await createQueuedFixture(1);
    await prisma.$executeRawUnsafe(
      'CREATE SEQUENCE c24_retry_sequence START 1',
    );
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION c24_retry_once() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.scope LIKE 'queue.call-next:%'
           AND nextval('c24_retry_sequence') = 1 THEN
          RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'certification serialization retry';
        END IF;
        RETURN NEW;
      END $$`);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER c24_retry_once BEFORE INSERT ON idempotency_records
      FOR EACH ROW EXECUTE FUNCTION c24_retry_once()`);
    try {
      await retry.repository.callNext(
        retry.access,
        retry.snapshot.id,
        retry.snapshot.version,
        new Date(),
        'c24-retry',
        command('c24-retry-key', `queue.call-next:${retry.snapshot.id}`, {}),
      );
      const state = await certificationState(retry.snapshot.id);
      expect(state.currentCount).toBe(1);
      expect(state.activities).toBe(3);
      expect(state.idempotencySuccess).toBe(2);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS c24_retry_once ON idempotency_records',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION IF EXISTS c24_retry_once()',
      );
      await prisma.$executeRawUnsafe(
        'DROP SEQUENCE IF EXISTS c24_retry_sequence',
      );
    }

    const exhausted = await createQueuedFixture(1);
    const before = await certificationState(exhausted.snapshot.id);
    await installFailureTrigger(
      'idempotency_records',
      'c24_retry_exhaustion',
      "NEW.scope LIKE 'queue.call-next:%'",
      '40001',
    );
    try {
      await expect(
        exhausted.repository.callNext(
          exhausted.access,
          exhausted.snapshot.id,
          exhausted.snapshot.version,
          new Date(),
          'c24-exhausted',
          command(
            'c24-exhausted-key',
            `queue.call-next:${exhausted.snapshot.id}`,
            {},
          ),
        ),
      ).rejects.toThrow('safely');
      expect(await certificationState(exhausted.snapshot.id)).toEqual(before);
    } finally {
      await removeFailureTrigger('idempotency_records', 'c24_retry_exhaustion');
    }
  });

  it('C25 — Timezone Change versus Current Lookup and Open', async () => {
    const setup = await openFixture(0);
    const before = await prisma.queueSession.findUniqueOrThrow({
      where: { id: setup.snapshot.id },
    });
    await prisma.clinic.update({
      where: { id: setup.fixture.clinicId },
      data: { timezone: 'Pacific/Kiritimati' },
    });
    const results = await Promise.allSettled([
      setup.repository.getCurrent(
        setup.access,
        setup.fixture.clinicId,
        setup.fixture.doctorId,
        new Date('2031-01-02T12:00:00Z'),
      ),
      setup.repository.open(
        setup.access,
        setup.fixture.clinicId,
        setup.fixture.doctorId,
        new Date('2031-01-02'),
        5,
        setup.snapshot.version,
        new Date('2031-01-02T12:00:00Z'),
        'c25-open-again',
        command('c25-open-again-key', 'queue.open:c25', {}),
      ),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    if (results[0].status === 'fulfilled')
      expect(results[0].value!.id).toBe(setup.snapshot.id);
    const sessions = await prisma.queueSession.findMany({
      where: {
        clinicId: setup.fixture.clinicId,
        doctorId: setup.fixture.doctorId,
      },
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.effectiveTimezone).toBe(before.effectiveTimezone);
    expect(sessions[0]!.operationalDate).toEqual(before.operationalDate);
    expect(
      await prisma.queueActivity.count({
        where: {
          queueSessionId: setup.snapshot.id,
          action: 'queue.session.opened',
        },
      }),
    ).toBe(1);
  });

  it('Certification manifest contains C1 through C25 exactly once', () => {
    const source = readFileSync(__filename, 'utf8');
    const matches = [...source.matchAll(/it\('C(\d+)\b/g)].map((match) =>
      Number(match[1]),
    );
    expect(matches.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
  });
});

function queueRepository() {
  return new PrismaQueueRepository(
    { db: prisma } as unknown as PrismaService,
    new PrismaAppointmentQueueCompletionPort(),
    {
      auditHashSecret: 'queue-hardening-audit-secret-32-characters',
    } as BackendConfiguration,
  );
}

async function sideEffectCounts(sessionId: string) {
  const [activities, queueAudits, globalAudits, outbox, idempotency] =
    await Promise.all([
      prisma.queueActivity.count({ where: { queueSessionId: sessionId } }),
      prisma.queueAudit.count({ where: { queueSessionId: sessionId } }),
      prisma.auditEvent.count({ where: { targetId: sessionId } }),
      prisma.outboxEvent.count({ where: { aggregateId: sessionId } }),
      prisma.idempotencyRecord.count({
        where: { scope: { startsWith: 'queue.foreign.' } },
      }),
    ]);
  return { activities, queueAudits, globalAudits, outbox, idempotency };
}

function command(key: string, scope: string, input: object): QueueCommand {
  return {
    key,
    scope,
    hash: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
  };
}

function staffAccess(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
    actorId: fixture.staffUserId,
    patient: false,
    doctor: false,
    platformAdministrator: false,
    organizationId: fixture.organizationId,
    clinicId: fixture.clinicId,
    capabilities: new Set<string>(),
  };
}

async function createFixture(appointmentCount: number) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const organization = await prisma.organization.create({
    data: { name: `Queue ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: 'Queue Clinic',
      code: `queue-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const doctorUser = await prisma.user.create({
    data: {
      staffAccount: { create: { email: `doctor-${suffix}@example.invalid` } },
    },
    include: { staffAccount: true },
  });
  const doctor = await prisma.$transaction(async (tx) => {
    const created = await tx.doctor.create({
      data: {
        organizationId: organization.id,
        staffAccountId: doctorUser.staffAccount!.id,
        firstName: 'Queue',
        lastName: 'Doctor',
        displayName: 'Dr. Queue',
        gender: 'unspecified',
        licenseNumber: `QUEUE-${suffix}`,
        yearsOfExperience: 5,
        languages: ['english'],
      },
    });
    await tx.doctorClinicAssignment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: created.id,
      },
    });
    return created;
  });
  const staff = await prisma.user.create({
    data: {
      staffAccount: { create: { email: `staff-${suffix}@example.invalid` } },
    },
  });
  const appointments = [];
  for (let index = 0; index < appointmentCount; index += 1) {
    const user = await prisma.user.create({
      data: {
        patientAccount: {
          create: {
            normalizedPhoneNumber: `+964750${Math.floor(
              Math.random() * 100_000_000,
            )
              .toString()
              .padStart(8, '0')}`,
          },
        },
      },
      include: { patientAccount: true },
    });
    const profile = await prisma.patientProfile.create({
      data: {
        patientAccountId: user.patientAccount!.id,
        firstName: `Patient${index}`,
        lastName: 'Queue',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'unspecified',
      },
    });
    await prisma.organizationPatientProfile.create({
      data: {
        organizationId: organization.id,
        patientProfileId: profile.id,
      },
    });
    const startsAt = new Date(
      Date.parse('2031-01-01T06:00:00Z') + index * 30 * 60_000,
    );
    const appointment = await prisma.appointment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: doctor.id,
        patientProfileId: profile.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 20 * 60_000),
        durationMinutes: 20,
        feeIqd: 25000,
        status: 'confirmed',
      },
    });
    const arrival = await prisma.appointmentArrival.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        appointmentId: appointment.id,
        patientProfileId: profile.id,
      },
    });
    const now = new Date();
    await prisma.appointmentArrival.update({
      where: { id: arrival.id },
      data: { status: 'arrived', arrivedAt: now, version: { increment: 1 } },
    });
    await prisma.appointmentArrival.update({
      where: { id: arrival.id },
      data: {
        status: 'queueReady',
        queueReadyAt: now,
        version: { increment: 1 },
      },
    });
    appointments.push({ id: appointment.id });
  }
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    doctorId: doctor.id,
    doctorUserId: doctorUser.id,
    staffUserId: staff.id,
    appointments,
  };
}

async function createQueuedFixture(appointmentCount: number) {
  const fixture = await createFixture(appointmentCount);
  const repository = queueRepository();
  const access = staffAccess(fixture);
  let snapshot = await repository.open(
    access,
    fixture.clinicId,
    fixture.doctorId,
    new Date('2031-01-01'),
    5,
    1,
    new Date('2031-01-01T05:30:00Z'),
    `setup-open-${Date.now()}`,
    command(
      `setup-open-${Date.now()}-${Math.random()}`,
      `queue.open:${fixture.clinicId}:${fixture.doctorId}`,
      {},
    ),
  );
  for (const [index, appointment] of fixture.appointments.entries()) {
    snapshot = await repository.enqueue(
      access,
      snapshot.id,
      appointment.id,
      snapshot.version,
      new Date('2031-01-01T05:45:00Z'),
      `setup-enqueue-${index}-${Date.now()}`,
      command(
        `setup-enqueue-${index}-${Date.now()}`,
        `queue.enqueue:${snapshot.id}`,
        appointment,
      ),
    );
  }
  return { fixture, repository, access, snapshot };
}

async function openFixture(appointmentCount: number) {
  const fixture = await createFixture(appointmentCount);
  const repository = queueRepository();
  const access = staffAccess(fixture);
  const snapshot = await repository.open(
    access,
    fixture.clinicId,
    fixture.doctorId,
    new Date('2031-01-01'),
    5,
    1,
    new Date(),
    `open-fixture-${Date.now()}`,
    command(
      `open-fixture-${Date.now()}`,
      `queue.open:${fixture.clinicId}:${fixture.doctorId}`,
      {},
    ),
  );
  return { fixture, repository, access, snapshot };
}

type QueuedFixture = Awaited<ReturnType<typeof createQueuedFixture>>;

async function currentFixture(
  target: 'called' | 'inConsultation' | 'noResponse',
  appointmentCount = 1,
) {
  const setup = await createQueuedFixture(appointmentCount);
  setup.snapshot = await setup.repository.callNext(
    setup.access,
    setup.snapshot.id,
    setup.snapshot.version,
    new Date(),
    `setup-call-${Date.now()}`,
    command(
      `setup-call-${Date.now()}`,
      `queue.call-next:${setup.snapshot.id}`,
      {},
    ),
  );
  if (target === 'called') return setup;
  const entry = await activeEntry(setup.snapshot.id);
  setup.snapshot = await setup.repository.transitionEntry(
    setup.access,
    setup.snapshot.id,
    entry.id,
    target === 'inConsultation' ? 'start' : 'no-response',
    setup.snapshot.version,
    entry.version,
    {
      recallGraceMinutes: 5,
      busyThresholdMinutes: 10,
      delayedThresholdMinutes: 25,
      fallbackConsultationMinutes: 20,
    },
    new Date(),
    `setup-${target}-${Date.now()}`,
    command(
      `setup-${target}-${Date.now()}`,
      `queue.setup.${target}:${setup.snapshot.id}:${entry.id}`,
      {},
    ),
  );
  return setup;
}

async function activeEntry(sessionId: string) {
  return prisma.queueEntry.findFirstOrThrow({
    where: {
      queueSessionId: sessionId,
      status: { in: ['called', 'inConsultation', 'noResponse'] },
    },
    orderBy: { ticketNumber: 'asc' },
  });
}

function entryCommand(
  setup: QueuedFixture,
  operation: 'recall' | 'no-response' | 'start' | 'complete',
  key: string,
  entryId?: string,
  entryVersion?: number,
) {
  return activeEntry(setup.snapshot.id).then((entry) =>
    setup.repository.transitionEntry(
      setup.access,
      setup.snapshot.id,
      entryId ?? entry.id,
      operation,
      setup.snapshot.version,
      entryVersion ?? entry.version,
      {
        recallGraceMinutes: 5,
        busyThresholdMinutes: 10,
        delayedThresholdMinutes: 25,
        fallbackConsultationMinutes: 20,
      },
      new Date(),
      `${key}-request`,
      command(key, `queue.${operation}:${setup.snapshot.id}:${entry.id}`, {
        sessionVersion: setup.snapshot.version,
        entryVersion: entryVersion ?? entry.version,
      }),
    ),
  );
}

async function expectStaleEntryCommand(
  target: 'called' | 'inConsultation' | 'noResponse',
  operation: 'recall' | 'no-response' | 'start' | 'complete',
) {
  const fixture = await createFixture(2);
  const repository = queueRepository();
  const access = staffAccess(fixture);
  let snapshot = await repository.open(
    access,
    fixture.clinicId,
    fixture.doctorId,
    new Date('2031-01-01'),
    5,
    1,
    new Date(),
    `c13-${operation}-open`,
    command(`c13-${operation}-open-key`, `queue.open:c13:${operation}`, {}),
  );
  snapshot = await repository.enqueue(
    access,
    snapshot.id,
    fixture.appointments[0]!.id,
    snapshot.version,
    new Date(),
    `c13-${operation}-enqueue-a`,
    command(`c13-${operation}-enqueue-a-key`, `queue.enqueue:${snapshot.id}`, {
      appointment: 0,
    }),
  );
  snapshot = await repository.callNext(
    access,
    snapshot.id,
    snapshot.version,
    new Date(),
    `c13-${operation}-call`,
    command(`c13-${operation}-call-key`, `queue.call-next:${snapshot.id}`, {}),
  );
  if (target !== 'called') {
    const entry = await activeEntry(snapshot.id);
    snapshot = await repository.transitionEntry(
      access,
      snapshot.id,
      entry.id,
      target === 'noResponse' ? 'no-response' : 'start',
      snapshot.version,
      entry.version,
      {
        recallGraceMinutes: 5,
        busyThresholdMinutes: 10,
        delayedThresholdMinutes: 25,
        fallbackConsultationMinutes: 20,
      },
      new Date(),
      `c13-${operation}-prepare`,
      command(
        `c13-${operation}-prepare-key`,
        `queue.prepare:${snapshot.id}:${entry.id}`,
        {},
      ),
    );
  }
  const targetEntry = await activeEntry(snapshot.id);
  const staleSessionVersion = snapshot.version;
  await repository.enqueue(
    access,
    snapshot.id,
    fixture.appointments[1]!.id,
    staleSessionVersion,
    new Date(),
    `c13-${operation}-enqueue-b`,
    command(`c13-${operation}-enqueue-b-key`, `queue.enqueue:${snapshot.id}`, {
      appointment: 1,
    }),
  );
  const before = await certificationState(snapshot.id);
  await expect(
    repository.transitionEntry(
      access,
      snapshot.id,
      targetEntry.id,
      operation,
      staleSessionVersion,
      targetEntry.version,
      {
        recallGraceMinutes: 5,
        busyThresholdMinutes: 10,
        delayedThresholdMinutes: 25,
        fallbackConsultationMinutes: 20,
      },
      new Date(),
      `c13-stale-${operation}`,
      command(
        `c13-stale-${operation}-key`,
        `queue.${operation}:${snapshot.id}:${targetEntry.id}`,
        {},
      ),
    ),
  ).rejects.toThrow('stale');
  expect(await certificationState(snapshot.id)).toEqual(before);
}

function expectStatuses(
  results: PromiseSettledResult<unknown>[],
  fulfilled: number,
  rejected: number,
) {
  const details = results.map((result) =>
    result.status === 'fulfilled'
      ? 'fulfilled'
      : result.reason instanceof Error
        ? `${result.reason.name}: ${result.reason.message}`
        : String(result.reason),
  );
  if (
    results.filter((result) => result.status === 'fulfilled').length !==
      fulfilled ||
    results.filter((result) => result.status === 'rejected').length !== rejected
  )
    throw new Error(details.join(' | '));
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(fulfilled);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
    rejected,
  );
}

async function certificationState(sessionId: string) {
  const session = await prisma.queueSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      entries: { orderBy: { ticketNumber: 'asc' } },
    },
  });
  const appointment = session.entries[0]
    ? await prisma.appointment.findUniqueOrThrow({
        where: { id: session.entries[0].appointmentId },
      })
    : null;
  const [
    activities,
    queueAudits,
    appointmentEvents,
    appointmentAudits,
    globalAudits,
    outbox,
    idempotency,
    idempotencySuccess,
  ] = await Promise.all([
    prisma.queueActivity.count({ where: { queueSessionId: sessionId } }),
    prisma.queueAudit.count({ where: { queueSessionId: sessionId } }),
    appointment
      ? prisma.appointmentEvent.count({
          where: { appointmentId: appointment.id },
        })
      : 0,
    appointment
      ? prisma.auditEvent.count({
          where: { targetType: 'Appointment', targetId: appointment.id },
        })
      : 0,
    prisma.auditEvent.count({ where: { targetId: sessionId } }),
    prisma.outboxEvent.count({
      where: {
        OR: [
          { aggregateId: sessionId },
          ...(appointment ? [{ aggregateId: appointment.id }] : []),
        ],
      },
    }),
    prisma.idempotencyRecord.count({
      where: {
        scope: { contains: sessionId },
      },
    }),
    prisma.idempotencyRecord.count({
      where: {
        responseCode: 200,
        scope: { contains: sessionId },
      },
    }),
  ]);
  return {
    sessionStatus: session.status,
    sessionVersion: session.version,
    nextTicket: session.nextTicket,
    operationalDate: session.operationalDate.toISOString(),
    effectiveTimezone: session.effectiveTimezone,
    entryCount: session.entries.length,
    entryStatuses: session.entries.map((entry) => entry.status),
    currentCount: session.entries.filter((entry) =>
      ['called', 'inConsultation'].includes(entry.status),
    ).length,
    tickets: session.entries.map((entry) => entry.ticketNumber),
    appointmentStatus: appointment?.status ?? null,
    appointmentVersion: appointment?.version ?? 0,
    activities,
    queueAudits,
    appointmentEvents,
    appointmentAudits,
    globalAudits,
    outbox,
    idempotency,
    idempotencySuccess,
  };
}

async function expectParticipantRace(
  kind: 'organization' | 'clinic' | 'doctor' | 'assignment' | 'patient',
) {
  const setup = await openFixture(1);
  const appointmentId = setup.fixture.appointments[0]!.id;
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });
  const before = await certificationState(setup.snapshot.id);
  const deactivate =
    kind === 'organization'
      ? prisma.organization.update({
          where: { id: setup.fixture.organizationId },
          data: { status: 'inactive' },
        })
      : kind === 'clinic'
        ? prisma.clinic.update({
            where: { id: setup.fixture.clinicId },
            data: { status: 'inactive' },
          })
        : kind === 'doctor'
          ? prisma.doctor.update({
              where: { id: setup.fixture.doctorId },
              data: { status: 'inactive' },
            })
          : kind === 'assignment'
            ? prisma.doctorClinicAssignment.update({
                where: {
                  organizationId_clinicId_doctorId: {
                    organizationId: setup.fixture.organizationId,
                    clinicId: setup.fixture.clinicId,
                    doctorId: setup.fixture.doctorId,
                  },
                },
                data: { status: 'inactive' },
              })
            : prisma.patientProfile.update({
                where: { id: appointment.patientProfileId },
                data: { status: 'inactive', version: { increment: 1 } },
              });
  const results = await Promise.allSettled([
    setup.repository.enqueue(
      setup.access,
      setup.snapshot.id,
      appointmentId,
      setup.snapshot.version,
      new Date(),
      `c-${kind}-enqueue`,
      command(
        `c-${kind}-enqueue-key`,
        `queue.enqueue:${setup.snapshot.id}`,
        {},
      ),
    ),
    deactivate,
  ]);
  expectStatuses(results, 1, 1);
  const state = await certificationState(setup.snapshot.id);
  expect(
    (state.entryCount === 1 &&
      state.sessionVersion === before.sessionVersion + 1) ||
      (state.entryCount === 0 &&
        state.sessionVersion === before.sessionVersion),
  ).toBe(true);
  expect(state.nextTicket).toBe(before.nextTicket + state.entryCount);
  const active =
    kind === 'organization'
      ? (
          await prisma.organization.findUniqueOrThrow({
            where: { id: setup.fixture.organizationId },
          })
        ).status
      : kind === 'clinic'
        ? (
            await prisma.clinic.findUniqueOrThrow({
              where: { id: setup.fixture.clinicId },
            })
          ).status
        : kind === 'doctor'
          ? (
              await prisma.doctor.findUniqueOrThrow({
                where: { id: setup.fixture.doctorId },
              })
            ).status
          : kind === 'assignment'
            ? (
                await prisma.doctorClinicAssignment.findUniqueOrThrow({
                  where: {
                    organizationId_clinicId_doctorId: {
                      organizationId: setup.fixture.organizationId,
                      clinicId: setup.fixture.clinicId,
                      doctorId: setup.fixture.doctorId,
                    },
                  },
                })
              ).status
            : (
                await prisma.patientProfile.findUniqueOrThrow({
                  where: { id: appointment.patientProfileId },
                })
              ).status;
  expect(
    (active === 'active' && state.entryCount === 1) ||
      (active === 'inactive' && state.entryCount === 0),
  ).toBe(true);
}

async function installFailureTrigger(
  table: string,
  name: string,
  condition: string,
  code: string,
) {
  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF ${condition} THEN
        RAISE EXCEPTION USING ERRCODE = '${code}', MESSAGE = '${name}';
      END IF;
      RETURN NEW;
    END $$`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER ${name} BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${name}()`);
}

async function removeFailureTrigger(table: string, name: string) {
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${name} ON ${table}`);
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${name}()`);
}
