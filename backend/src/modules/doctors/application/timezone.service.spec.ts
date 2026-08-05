import { BadRequestException } from '@nestjs/common';
import { TimezoneService } from './timezone.service';

describe('TimezoneService', () => {
  const service = new TimezoneService();

  it('converts UTC instants only at the projection boundary', () => {
    expect(
      service.localClock(new Date('2026-07-20T05:30:00.000Z'), 'Asia/Baghdad'),
    ).toEqual({ date: '2026-07-20', weekday: 1, minuteOfDay: 510 });
  });

  it('handles a timezone whose local date differs from UTC', () => {
    expect(
      service.localClock(new Date('2026-07-20T23:30:00.000Z'), 'Asia/Baghdad'),
    ).toEqual({ date: '2026-07-21', weekday: 2, minuteOfDay: 150 });
  });

  it('rejects invalid IANA timezone identifiers', () => {
    expect(() => service.assertValid('Iraq/Definitely-Invalid')).toThrow(
      BadRequestException,
    );
  });

  it('uses ICU offset changes across a daylight-saving boundary', () => {
    expect(
      service.localClock(
        new Date('2026-03-08T06:30:00.000Z'),
        'America/New_York',
      ).minuteOfDay,
    ).toBe(90);
    expect(
      service.localClock(
        new Date('2026-03-08T07:30:00.000Z'),
        'America/New_York',
      ).minuteOfDay,
    ).toBe(210);
  });

  it('converts Iraq local booking time to one deterministic UTC instant', () => {
    expect(
      service
        .instantForLocalDateMinute('2030-07-22', 9 * 60, 'Asia/Baghdad')
        ?.toISOString(),
    ).toBe('2030-07-22T06:00:00.000Z');
  });

  it('supports 24:00 as the next local midnight and rejects invalid input', () => {
    expect(
      service
        .instantForLocalDateMinute('2030-07-22', 1440, 'Asia/Baghdad')
        ?.toISOString(),
    ).toBe('2030-07-22T21:00:00.000Z');
    expect(
      service.instantForLocalDateMinute('2030-02-31', 60, 'Asia/Baghdad'),
    ).toBeNull();
    expect(
      service.instantForLocalDateMinute('2030-07-22', 1441, 'Asia/Baghdad'),
    ).toBeNull();
  });
});
