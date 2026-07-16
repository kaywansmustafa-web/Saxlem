import { loadConfiguration } from './environment';

const required = {
  DATABASE_URL: 'postgresql://example.invalid/saxlem',
  ACCESS_TOKEN_SECRET: 'a'.repeat(32),
  REFRESH_TOKEN_SECRET: 'b'.repeat(32),
};

describe('backend configuration safety', () => {
  it.each([undefined, '', 'unexpected'])(
    'fails closed to production for %p environment',
    (value) => {
      expect(
        loadConfiguration({ ...required, SAXLEM_BACKEND_ENV: value })
          .environment,
      ).toBe('production');
    },
  );

  it('accepts an explicit supported environment', () => {
    expect(
      loadConfiguration({ ...required, SAXLEM_BACKEND_ENV: 'development' }),
    ).toMatchObject({
      environment: 'development',
      configurationWasExplicit: true,
    });
  });

  it('rejects missing security and database configuration', () => {
    expect(() =>
      loadConfiguration({ SAXLEM_BACKEND_ENV: 'production' }),
    ).toThrow();
  });
});
