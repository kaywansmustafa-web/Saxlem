import { DoctorScheduleDtoMapper } from './doctor-schedule-dto.mapper';

describe('DoctorScheduleDtoMapper', () => {
  it('formats wall-clock rules and strips internal identifiers', () => {
    const result = new DoctorScheduleDtoMapper().clinicHours({
      clinicId: 'clinic',
      clinicName: 'Clinic',
      organizationId: 'private-organization',
      timezone: {
        identifier: 'Asia/Baghdad',
        instantStorage: 'UTC',
        recurringRuleClock: 'clinicLocalWallClock',
      },
      workingHours: [
        {
          id: 'private-record',
          weekday: 1,
          startsMinute: 485,
          endsMinute: 1020,
        },
      ],
    });
    expect(result.workingHours).toEqual([
      { weekday: 1, startsAt: '08:05', endsAt: '17:00' },
    ]);
    expect(JSON.stringify(result)).not.toContain('private-organization');
    expect(JSON.stringify(result)).not.toContain('private-record');
  });
});
