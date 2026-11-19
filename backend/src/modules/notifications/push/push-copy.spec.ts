import { clinicMoment, pushMessage } from './push-copy';

const payload = (context: object) => ({ actionCode: 'x', context });

describe('push copy', () => {
  it('names the doctor and the clinic time of a visit', () => {
    expect(
      pushMessage(
        'appointment.reminder.soon',
        payload({
          doctorName: 'Dr. Shilan',
          startsAt: '2026-11-19T07:30:00.000Z',
        }),
        'en',
      ),
    ).toEqual({
      title: 'Your visit is soon',
      body: 'Dr. Shilan · 19 Nov · 10:30',
    });
    expect(
      pushMessage(
        'appointment.booked',
        payload({ doctorName: 'د. شیلان', startsAt: '2026-11-19T07:30:00Z' }),
        'ku',
      ),
    ).toEqual({
      title: '\u200Fژڤانا تە هاتە پشتڕاستکرن',
      body: '\u200Fد. شیلان · 19 چریا دووێ · 10:30',
    });
  });

  it('says how many are ahead in the queue, in each language', () => {
    const p = payload({ ticketNumber: 12, ahead: 2 });
    expect(pushMessage('queue.patient.almost', p, 'en')?.body).toBe(
      'Ticket 12 · 2 people ahead of you',
    );
    expect(pushMessage('queue.patient.almost', p, 'ar')?.body).toBe(
      '\u200Fرقم 12 · شخصان قبلك',
    );
    expect(pushMessage('queue.patient.almost', p, 'ku')?.body).toBe(
      '\u200Fژمارا تیکێتێ 12 · 2 کەس بەری تە نە',
    );
  });

  it('falls back to what to do when there is no detail', () => {
    expect(pushMessage('queue.patient.called', {}, 'en')).toEqual({
      title: "It's your turn",
      body: 'Please go in to the doctor now.',
    });
  });

  it('keeps Kurdish and Arabic pushes right to left', () => {
    const p = payload({ doctorName: 'Dr. Shilan', ticketNumber: 3 });
    for (const locale of ['ku', 'ar'] as const) {
      const message = pushMessage('queue.patient.called', p, locale)!;
      expect(message.title.startsWith('\u200F')).toBe(true);
      expect(message.body.startsWith('\u200F')).toBe(true);
    }
    const english = pushMessage('queue.patient.called', p, 'en')!;
    expect(english.body).toBe('Ticket 3 · Dr. Shilan');
  });

  it('pushes nothing for types it has no words for', () => {
    expect(pushMessage('queue.board.updated', {}, 'en')).toBeNull();
  });

  it('crosses midnight at the clinic, not on the server', () => {
    expect(clinicMoment('2026-11-19T22:15:00Z', 'en')).toBe('20 Nov · 01:15');
    expect(clinicMoment('nonsense', 'en')).toBeNull();
  });
});
