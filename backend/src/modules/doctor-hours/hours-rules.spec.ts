import { checkWeek, strayBreaks } from './hours-rules';

const p = (weekday: number, from: string, to: string) => {
  const m = (t: string) => {
    const [h, mm] = t.split(':').map(Number);
    return h! * 60 + mm!;
  };
  return { weekday, startsMinute: m(from), endsMinute: m(to) };
};

describe('weekly hours rules', () => {
  it('accepts split days and sorts them', () => {
    const result = checkWeek(
      [p(1, '16:00', '20:00'), p(1, '09:00', '13:00'), p(0, '09:00', '12:00')],
      'hours',
    );
    expect(result).toEqual({
      ok: true,
      periods: [
        p(0, '09:00', '12:00'),
        p(1, '09:00', '13:00'),
        p(1, '16:00', '20:00'),
      ],
    });
    expect(checkWeek([p(6, '00:00', '24:00')], 'hours').ok).toBe(true);
  });

  it('refuses overlaps, backwards periods and odd minutes', () => {
    expect(
      checkWeek([p(1, '09:00', '13:00'), p(1, '12:00', '15:00')], 'hours'),
    ).toEqual({
      ok: false,
      error: 'Working periods on the same day overlap.',
    });
    expect(checkWeek([p(1, '13:00', '09:00')], 'hours').ok).toBe(false);
    expect(checkWeek([p(1, '09:03', '10:00')], 'hours').ok).toBe(false);
    expect(checkWeek([p(7, '09:00', '10:00')], 'hours').ok).toBe(false);
    expect(
      checkWeek([{ weekday: 1, startsMinute: 0, endsMinute: 1445 }], 'hours')
        .ok,
    ).toBe(false);
    expect(
      checkWeek(
        Array.from({ length: 29 }, (_, i) => p(i % 7, '09:00', '09:05')),
        'breaks',
      ).ok,
    ).toBe(false);
  });

  it('finds breaks outside working hours', () => {
    expect(
      strayBreaks(
        [p(1, '09:00', '17:00')],
        [p(1, '12:00', '13:00'), p(2, '12:00', '13:00')],
      ),
    ).toEqual([p(2, '12:00', '13:00')]);
  });
});
