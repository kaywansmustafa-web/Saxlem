import { assertSafeDatabaseUrl } from './database-safety';

describe('database target safety', () => {
  it('accepts only the isolated local test database', () => {
    expect(
      assertSafeDatabaseUrl(
        'postgresql://u:p@localhost:5434/saxlem_test',
        'test',
      ).pathname,
    ).toBe('/saxlem_test');
  });
  it.each([
    undefined,
    '',
    'postgresql://u:p@localhost:5433/saxlem_development',
    'postgresql://u:p@example.com/saxlem_test',
    'postgresql://u:p@localhost/saxlem_production',
  ])('rejects unsafe reset target %p', (value) =>
    expect(() => assertSafeDatabaseUrl(value, 'test')).toThrow(),
  );
});
