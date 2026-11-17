import { collectionStage, dueAt } from './collections';

const day = (n: number) => new Date(Date.UTC(2026, 10, 1) + n * 86_400_000);

describe('collection stages', () => {
  const base = { owedIqd: 5000, graceUntil: null, hiddenAt: null };
  it('is due for 14 days after the statement ends', () => {
    expect(dueAt(day(0))).toEqual(day(14));
    expect(
      collectionStage({ ...base, oldestDueAt: day(14), now: day(10) }).stage,
    ).toBe('due');
  });
  it('goes overdue, warns from day 45 and hides from day 60', () => {
    const at = (n: number) =>
      collectionStage({ ...base, oldestDueAt: day(14), now: day(14 + n) });
    expect(at(0).stage).toBe('overdue');
    expect(at(44).stage).toBe('overdue');
    expect(at(45).stage).toBe('warning');
    expect(at(60).stage).toBe('hidden');
    expect(at(0).hideOn).toEqual(day(74));
  });
  it('gives more time with grace and clears once paid', () => {
    const grace = collectionStage({
      ...base,
      oldestDueAt: day(14),
      graceUntil: day(104),
      now: day(80),
    });
    expect(grace.stage).toBe('overdue');
    expect(grace.hideOn).toEqual(day(104));
    expect(
      collectionStage({
        ...base,
        owedIqd: 0,
        oldestDueAt: day(14),
        now: day(90),
      }).stage,
    ).toBe('clear');
  });
});
