import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AppointmentRepository } from '../domain/appointment.repository';
import type { AppointmentService } from './appointment.service';
import { clinicDate, EarlierTimeService } from './earlier-time.service';

const notify = jest.fn<Promise<boolean>, unknown[]>().mockResolvedValue(true);
jest.mock('../../../common/notifications/patient-notifications', () => ({
  notifyPatient: (...args: unknown[]) => notify(...args),
}));

const now = new Date('2026-11-19T05:00:00.000Z'); // 08:00 in Duhok
const patient = {
  actorId: 'u1',
  patient: true,
  doctor: false,
  platformAdministrator: false,
};

function request(overrides: Record<string, unknown> = {}) {
  return {
    appointmentId: 'a1',
    lastOfferedAt: null,
    lastOfferedStartsAt: null,
    ...overrides,
    appointment: {
      id: 'a1',
      organizationId: 'o1',
      clinicId: 'c1',
      doctorId: 'd1',
      patientProfileId: 'p1',
      type: 'initial',
      status: 'confirmed',
      startsAt: new Date('2026-11-21T07:00:00.000Z'),
      durationMinutes: 30,
      clinic: { name: 'Hillview', timezone: 'Asia/Baghdad' },
      doctorAssignment: { doctor: { displayName: 'Dr. Shilan' } },
      patientRegistration: {
        patientProfile: { patientAccount: { userId: 'u1' } },
      },
      ...((overrides.appointment as object) ?? {}),
    },
  };
}

function setup(
  requests: ReturnType<typeof request>[],
  slots: string[],
  visit: Record<string, unknown> = {},
) {
  const update = jest.fn<Promise<object>, [object]>().mockResolvedValue({});
  const remove = jest.fn().mockResolvedValue({ count: 1 });
  const upsert = jest.fn().mockResolvedValue({});
  const bookingOptions = jest
    .fn<Promise<object>, unknown[]>()
    .mockResolvedValue({
      days: [
        {
          date: '2026-11-19',
          slots: slots.map((startsAt) => ({ startsAt, durationMinutes: 30 })),
        },
      ],
    });
  const tx = { earlierTimeRequest: { update } };
  const service = new EarlierTimeService(
    {
      db: {
        earlierTimeRequest: {
          findMany: jest.fn().mockResolvedValue(requests),
          findUnique: jest.fn().mockResolvedValue(requests[0] ?? null),
          deleteMany: remove,
          upsert,
        },
        $transaction: (run: (t: typeof tx) => Promise<unknown>) => run(tx),
      },
    } as unknown as PrismaService,
    {
      get: jest.fn().mockResolvedValue({
        id: 'a1',
        organizationId: 'o1',
        clinicId: 'c1',
        patientProfileId: 'p1',
        status: 'confirmed',
        startsAt: '2026-11-21T07:00:00.000Z',
        durationMinutes: 30,
        ...visit,
      }),
    } as unknown as AppointmentRepository,
    { bookingOptions } as unknown as AppointmentService,
  );
  return { service, update, remove, upsert, bookingOptions };
}

describe('tell me if an earlier time opens', () => {
  beforeEach(() => notify.mockClear());

  it('offers the first free time at least 2 h away and 30 min earlier', async () => {
    const { service, update, bookingOptions } = setup(
      [request()],
      [
        '2026-11-19T06:00:00.000Z', // only an hour away
        '2026-11-19T08:00:00.000Z',
        '2026-11-20T09:00:00.000Z',
      ],
    );
    expect(await service.offer(now)).toBe(1);
    expect(bookingOptions.mock.calls[0]!.slice(5, 7)).toEqual([
      '2026-11-19',
      '2026-11-21',
    ]);
    expect(update.mock.calls[0]![0]).toEqual({
      where: { appointmentId: 'a1' },
      data: {
        lastOfferedStartsAt: new Date('2026-11-19T08:00:00.000Z'),
        lastOfferedAt: now,
      },
    });
    expect(notify.mock.calls[0]![1]).toMatchObject({
      type: 'appointment.earlier.available',
      context: {
        startsAt: '2026-11-19T08:00:00.000Z',
        doctorName: 'Dr. Shilan',
      },
    });
  });

  it("doesn't repeat itself or nag", async () => {
    const same = setup(
      [request({ lastOfferedStartsAt: new Date('2026-11-19T08:00:00.000Z') })],
      ['2026-11-19T08:00:00.000Z'],
    );
    expect(await same.service.offer(now)).toBe(0);
    const recent = setup(
      [request({ lastOfferedAt: new Date(now.getTime() - 60 * 60_000) })],
      ['2026-11-19T09:00:00.000Z'],
    );
    expect(await recent.service.offer(now)).toBe(0);
    expect(recent.bookingOptions).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('stops watching visits that were cancelled or are now too close', async () => {
    const { service, remove, bookingOptions } = setup(
      [request({ appointment: { status: 'cancelled' } })],
      ['2026-11-19T08:00:00.000Z'],
    );
    expect(await service.offer(now)).toBe(0);
    expect(remove).toHaveBeenCalledWith({ where: { appointmentId: 'a1' } });
    expect(bookingOptions).not.toHaveBeenCalled();
  });

  it('only patients, and only for visits at least 3 hours away', async () => {
    await expect(
      setup([], []).service.watch({ ...patient, patient: false }, 'a1', now),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      setup([], [], { startsAt: '2026-11-19T07:00:00.000Z' }).service.watch(
        patient,
        'a1',
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    const ok = setup([], []);
    await ok.service.watch(patient, 'a1', now);
    expect(ok.upsert).toHaveBeenCalled();
  });

  it('shows an offer only while it is still ahead and earlier', async () => {
    const offered = setup(
      [request({ lastOfferedStartsAt: new Date('2026-11-20T06:00:00.000Z') })],
      [],
    );
    expect(await offered.service.status(patient, 'a1', now)).toEqual({
      watching: true,
      offer: {
        startsAt: '2026-11-20T06:00:00.000Z',
        endsAt: '2026-11-20T06:30:00.000Z',
        durationMinutes: 30,
      },
    });
    const gone = setup(
      [request({ lastOfferedStartsAt: new Date('2026-11-19T05:30:00.000Z') })],
      [],
    );
    expect((await gone.service.status(patient, 'a1', now)).offer).toBeNull();
    expect(clinicDate(new Date('2026-11-19T22:30:00Z'), 'Asia/Baghdad')).toBe(
      '2026-11-20',
    );
  });
});
