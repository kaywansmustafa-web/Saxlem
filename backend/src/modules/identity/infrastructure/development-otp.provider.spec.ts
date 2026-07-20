import { DevelopmentOtpProvider } from './development-otp.provider';
describe('development OTP provider isolation', () => {
  it.each(['qa', 'production', 'unknown'])(
    'fails closed in %s',
    (environment) =>
      expect(() => DevelopmentOtpProvider.create(environment)).toThrow(),
  );
  it.each(['development', 'test'])('is available in %s', (environment) =>
    expect(DevelopmentOtpProvider.create(environment)).toBeDefined(),
  );
});
