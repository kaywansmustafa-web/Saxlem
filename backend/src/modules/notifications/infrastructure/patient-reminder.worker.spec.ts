import { dueReminder } from './patient-reminder.worker';
import { readNotificationContext } from '../../../common/notifications/patient-notifications';

const HOUR = 3_600_000;
const now = new Date('2026-11-18T12:00:00.000Z');
const at = (hours: number) => new Date(now.getTime() + hours * HOUR);

describe('visit reminders', () => {
  it('reminds the day before a visit booked days ahead', () => {
    expect(dueReminder(at(20), at(-72), now)).toBe(
      'appointment.reminder.day-before',
    );
  });
  it('reminds shortly before the visit', () => {
    expect(dueReminder(at(1.5), at(-72), now)).toBe(
      'appointment.reminder.soon',
    );
  });
  it('does not remind a visit booked only just now', () => {
    expect(dueReminder(at(20), at(-1), now)).toBeNull();
    expect(dueReminder(at(1), at(-0.5), now)).toBeNull();
  });
  it('stays quiet between the two reminders and after the start', () => {
    expect(dueReminder(at(2.5), at(-72), now)).toBeNull();
    expect(dueReminder(at(30), at(-72), now)).toBeNull();
    expect(dueReminder(at(-0.1), at(-72), now)).toBeNull();
  });
});

describe('notification context', () => {
  it('keeps only known, well-formed fields', () => {
    expect(
      readNotificationContext({
        actionCode: 'appointment.booked',
        context: {
          doctorName: 'Dr. Shilan',
          ticketNumber: 4,
          ahead: -1,
          phone: '+9647500000000',
          startsAt: '',
        },
      }),
    ).toEqual({ doctorName: 'Dr. Shilan', ticketNumber: 4 });
  });
  it('has no context for old records', () => {
    expect(
      readNotificationContext({ actionCode: 'queue.patient.called' }),
    ).toBeNull();
    expect(readNotificationContext(null)).toBeNull();
  });
});
