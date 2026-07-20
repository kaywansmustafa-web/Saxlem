import { InMemoryRateLimiter } from './in-memory-rate-limiter';

describe('InMemoryRateLimiter', () => {
  it('enforces authentication action limits independently', async () => {
    const limiter = new InMemoryRateLimiter();
    await expect(limiter.consume('identity', 'otpRequest')).resolves.toBe(true);
    await expect(limiter.consume('identity', 'otpRequest')).resolves.toBe(true);
    await expect(limiter.consume('identity', 'otpRequest')).resolves.toBe(true);
    await expect(limiter.consume('identity', 'otpRequest')).resolves.toBe(
      false,
    );
    await expect(limiter.consume('identity', 'login')).resolves.toBe(true);
  });
});
