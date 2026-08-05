import { BadRequestException, Injectable } from '@nestjs/common';
import type { Weekday } from '../domain/doctor-schedule';

export interface LocalClock {
  readonly date: string;
  readonly weekday: Weekday;
  readonly minuteOfDay: number;
}

@Injectable()
export class TimezoneService {
  assertValid(timezone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(0);
    } catch {
      throw new BadRequestException('Timezone identifier is invalid.');
    }
  }

  localClock(instant: Date, timezone: string): LocalClock {
    this.assertValid(timezone);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    }).formatToParts(instant);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    const weekdays: Record<string, Weekday> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return Object.freeze({
      date: `${value('year')}-${value('month')}-${value('day')}`,
      weekday: weekdays[value('weekday')] ?? 0,
      minuteOfDay: Number(value('hour')) * 60 + Number(value('minute')),
    });
  }

  instantForLocalDateMinute(
    date: string,
    minuteOfDay: number,
    timezone: string,
  ): Date | null {
    this.assertValid(timezone);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match || minuteOfDay < 0 || minuteOfDay > 1440) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const calendarProbe = new Date(Date.UTC(year, month - 1, day));
    if (
      calendarProbe.getUTCFullYear() !== year ||
      calendarProbe.getUTCMonth() !== month - 1 ||
      calendarProbe.getUTCDate() !== day
    )
      return null;
    const hour = minuteOfDay === 1440 ? 0 : Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay === 1440 ? 0 : minuteOfDay % 60;
    const target = Date.UTC(
      year,
      month - 1,
      day + (minuteOfDay === 1440 ? 1 : 0),
      hour,
      minute,
    );
    let candidate = new Date(target);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const clock = this.localClock(candidate, timezone);
      const [clockYear, clockMonth, clockDay] = clock.date
        .split('-')
        .map(Number);
      const represented = Date.UTC(
        clockYear!,
        clockMonth! - 1,
        clockDay,
        Math.floor(clock.minuteOfDay / 60),
        clock.minuteOfDay % 60,
      );
      candidate = new Date(candidate.getTime() + target - represented);
    }
    const expected = new Date(target);
    const clock = this.localClock(candidate, timezone);
    const expectedDate = `${expected.getUTCFullYear().toString().padStart(4, '0')}-${(expected.getUTCMonth() + 1).toString().padStart(2, '0')}-${expected.getUTCDate().toString().padStart(2, '0')}`;
    const expectedMinute =
      expected.getUTCHours() * 60 + expected.getUTCMinutes();
    return clock.date === expectedDate && clock.minuteOfDay === expectedMinute
      ? candidate
      : null;
  }
}
