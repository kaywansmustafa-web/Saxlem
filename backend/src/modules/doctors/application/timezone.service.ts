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
}
