import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { TimezoneService } from './timezone.service';
import type { DoctorScheduleRepository } from '../domain/doctor-schedule.repository';
import type { DoctorScheduleProjection } from '../domain/doctor-schedule';

const baseSchedule: DoctorScheduleProjection = Object.freeze({
  doctorId: 'doctor',
  doctorName: 'Dr. Test',
  organizationId: 'organization',
  clinics: Object.freeze([
    Object.freeze({
      clinicId: 'clinic',
      clinicName: 'Clinic',
      timezone: {
        identifier: 'Asia/Baghdad',
        instantStorage: 'UTC' as const,
        recurringRuleClock: 'clinicLocalWallClock' as const,
      },
      workingHours: Object.freeze([]),
      weeklySchedule: Object.freeze([
        Object.freeze({
          id: 'weekly',
          weekday: 1,
          startsMinute: 480,
          endsMinute: 960,
        }),
      ]),
      breaks: Object.freeze([
        Object.freeze({
          id: 'break',
          weekday: 1,
          startsMinute: 720,
          endsMinute: 750,
        }),
      ]),
      leave: Object.freeze([]),
      holidays: Object.freeze([]),
      exceptions: Object.freeze([]),
    }),
  ]),
});

describe('DoctorScheduleService', () => {
  const access = {
    actorId: 'patient',
    patient: true,
    platformAdministrator: false,
  };

  it('calculates weekly work and break state in clinic time', async () => {
    const service = createService(baseSchedule);
    const working = await service.availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'request',
    );
    expect(working.clinics[0]).toMatchObject({
      status: 'workingToday',
      isWorkingNow: true,
      precedenceSource: 'weeklySchedule',
    });
    const onBreak = await service.availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T09:15:00.000Z'),
      'request',
    );
    expect(onBreak.clinics[0]?.isWorkingNow).toBe(false);
  });

  it.each([
    ['leave', 'onLeave', 'leave'],
    ['holiday', 'holiday', 'holiday'],
  ] as const)(
    'applies %s over the weekly schedule',
    async (kind, status, source) => {
      const period = {
        id: kind,
        startsAt: '2026-07-20T00:00:00.000Z',
        endsAt: '2026-07-21T00:00:00.000Z',
      };
      const clinic = baseSchedule.clinics[0]!;
      const schedule: DoctorScheduleProjection = {
        ...baseSchedule,
        clinics: [
          {
            ...clinic,
            leave: kind === 'leave' ? [period] : [],
            holidays:
              kind === 'holiday' ? [{ ...period, name: 'Holiday' }] : [],
          },
        ],
      };
      const result = await createService(schedule).availability(
        access,
        'doctor',
        'clinic',
        new Date('2026-07-20T06:00:00.000Z'),
        'request',
      );
      expect(result.clinics[0]).toMatchObject({
        status,
        isWorkingNow: false,
        precedenceSource: source,
      });
    },
  );

  it('applies a working exception over leave and holiday', async () => {
    const period = {
      id: 'period',
      startsAt: '2026-07-20T05:00:00.000Z',
      endsAt: '2026-07-20T10:00:00.000Z',
    };
    const clinic = baseSchedule.clinics[0]!;
    const schedule: DoctorScheduleProjection = {
      ...baseSchedule,
      clinics: [
        {
          ...clinic,
          leave: [period],
          holidays: [{ ...period, name: 'Holiday' }],
          exceptions: [{ ...period, kind: 'working' }],
        },
      ],
    };
    const result = await createService(schedule).availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'request',
    );
    expect(result.clinics[0]).toMatchObject({
      status: 'workingToday',
      isWorkingNow: true,
      precedenceSource: 'exception',
      holidayName: null,
      breakPeriods: [],
      workingPeriods: [
        {
          source: 'exception',
          timeBasis: 'UTC',
          startsAt: period.startsAt,
          endsAt: period.endsAt,
        },
      ],
    });
  });

  it('does not expose a lower-priority holiday name when leave wins', async () => {
    const period = {
      id: 'period',
      startsAt: '2026-07-20T00:00:00.000Z',
      endsAt: '2026-07-21T00:00:00.000Z',
    };
    const clinic = baseSchedule.clinics[0]!;
    const result = await createService({
      ...baseSchedule,
      clinics: [
        {
          ...clinic,
          leave: [period],
          holidays: [{ ...period, name: 'Internal holiday' }],
        },
      ],
    }).availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'request',
    );
    expect(result.clinics[0]).toMatchObject({
      precedenceSource: 'leave',
      holidayName: null,
    });
  });

  it('keeps holiday metadata only when holiday is the winning rule', async () => {
    const period = {
      id: 'period',
      startsAt: '2026-07-20T00:00:00.000Z',
      endsAt: '2026-07-21T00:00:00.000Z',
    };
    const clinic = baseSchedule.clinics[0]!;
    const holidayOnly = await createService({
      ...baseSchedule,
      clinics: [{ ...clinic, holidays: [{ ...period, name: 'Holiday' }] }],
    }).availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'request',
    );
    expect(holidayOnly.clinics[0]?.holidayName).toBe('Holiday');
    const closedException = await createService({
      ...baseSchedule,
      clinics: [
        {
          ...clinic,
          holidays: [{ ...period, name: 'Holiday' }],
          exceptions: [{ ...period, kind: 'closed' }],
        },
      ],
    }).availability(
      access,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'request',
    );
    expect(closedException.clinics[0]).toMatchObject({
      precedenceSource: 'exception',
      holidayName: null,
      status: 'unavailable',
    });
  });

  it('records one atomic audit batch with one event per affected clinic', async () => {
    const repository = repositoryFor({
      ...baseSchedule,
      clinics: [
        baseSchedule.clinics[0]!,
        {
          ...baseSchedule.clinics[0]!,
          clinicId: 'clinic-two',
          clinicName: 'Clinic Two',
        },
      ],
    });
    const recordReads = jest.fn().mockResolvedValue(undefined);
    repository.recordReads = recordReads;
    const service = new DoctorScheduleService(
      repository,
      new TimezoneService(),
    );
    await service.schedule(
      { actorId: 'admin', patient: false, platformAdministrator: true },
      'doctor',
      undefined,
      'request',
    );
    expect(recordReads).toHaveBeenCalledWith([
      expect.objectContaining({ clinicId: 'clinic' }),
      expect.objectContaining({ clinicId: 'clinic-two' }),
    ]);
  });

  it('limits a doctor-role schedule to its linked doctor but permits tenant availability', async () => {
    const repository = repositoryFor(baseSchedule);
    const findDoctorSchedule: jest.MockedFunction<
      DoctorScheduleRepository['findDoctorSchedule']
    > = jest.fn().mockResolvedValue(baseSchedule);
    repository.findDoctorSchedule = findDoctorSchedule;
    const service = new DoctorScheduleService(
      repository,
      new TimezoneService(),
    );
    const doctorAccess = {
      actorId: 'doctor-user',
      patient: false,
      doctor: true,
      platformAdministrator: false,
      organizationId: 'organization',
      clinicId: 'clinic',
    };
    await service.schedule(
      doctorAccess,
      'doctor',
      'clinic',
      'schedule-request',
    );
    expect(findDoctorSchedule.mock.calls[0]?.[1]).toMatchObject({
      doctorActorId: 'doctor-user',
      clinicAssignmentVisibility: 'activeOrInactive',
    });
    await service.availability(
      doctorAccess,
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'availability-request',
    );
    expect(findDoctorSchedule.mock.calls[1]?.[1]).not.toHaveProperty(
      'doctorActorId',
    );
    expect(findDoctorSchedule.mock.calls[1]?.[1]).toMatchObject({
      clinicAssignmentVisibility: 'activeOrInactive',
    });
  });

  it('requires active clinic assignments for patient availability', async () => {
    const repository = repositoryFor(baseSchedule);
    const service = new DoctorScheduleService(
      repository,
      new TimezoneService(),
    );
    await service.availability(
      {
        actorId: 'patient',
        patient: true,
        platformAdministrator: false,
      },
      'doctor',
      'clinic',
      new Date('2026-07-20T06:00:00.000Z'),
      'availability-request',
    );
    expect(repository.findDoctorSchedule.mock.calls[0]?.[1]).toMatchObject({
      clinicId: 'clinic',
      clinicAssignmentVisibility: 'active',
    });
  });

  it('enforces staff clinic scope and fails closed when auditing fails', async () => {
    const repository = repositoryFor(baseSchedule);
    const service = new DoctorScheduleService(
      repository,
      new TimezoneService(),
    );
    const staff = {
      actorId: 'staff',
      patient: false,
      platformAdministrator: false,
      organizationId: 'organization',
      clinicId: 'clinic',
    };
    await expect(
      service.schedule(staff, 'doctor', 'foreign', 'request'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    repository.recordReads = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(
      service.schedule(staff, 'doctor', 'clinic', 'request'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

function repositoryFor(
  schedule: DoctorScheduleProjection,
): jest.Mocked<DoctorScheduleRepository> {
  return {
    findDoctorSchedule: jest.fn().mockResolvedValue(schedule),
    findClinicHours: jest.fn(),
    recordReads: jest.fn().mockResolvedValue(undefined),
  };
}

function createService(schedule: DoctorScheduleProjection) {
  return new DoctorScheduleService(
    repositoryFor(schedule),
    new TimezoneService(),
  );
}
