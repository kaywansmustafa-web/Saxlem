import {
  assertPasswordPolicy,
  hashOtp,
  hashPassword,
  safeEqualHex,
  verifyPassword,
} from './security';

describe('identity cryptography', () => {
  it('hashes staff passwords with Argon2id and verifies them', async () => {
    const hash = await hashPassword('Correct Horse Battery Staple!');
    expect(hash).toContain('$argon2id$');
    await expect(
      verifyPassword(hash, 'Correct Horse Battery Staple!'),
    ).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
  });
  it('enforces password policy', () => {
    expect(() => assertPasswordPolicy('short')).toThrow();
    expect(() =>
      assertPasswordPolicy('Long-Unique-Password-123!'),
    ).not.toThrow();
  });
  it('compares OTP hashes safely', () => {
    const hash = hashOtp('+9647500000000', '123456', 'secret');
    expect(safeEqualHex(hash, hash)).toBe(true);
    expect(
      safeEqualHex(hash, hashOtp('+9647500000000', '654321', 'secret')),
    ).toBe(false);
  });
});
