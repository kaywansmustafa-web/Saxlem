import { CredentialCipher } from './credential-cipher';

describe('CredentialCipher', () => {
  it('round-trips, uses a fresh nonce and detects tampering', () => {
    const cipher = new CredentialCipher('key-one-0123456789-abcdefghijklmnop');
    const a = cipher.encrypt('secret');
    const b = cipher.encrypt('secret');
    expect(a).not.toBe(b);
    expect(a.startsWith('v1.')).toBe(true);
    expect(cipher.decrypt(a)).toBe('secret');
    const parts = a.split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    expect(() => cipher.decrypt(parts.join('.'))).toThrow();
    expect(() =>
      new CredentialCipher('key-two-0123456789-abcdefghijklmnop').decrypt(a),
    ).toThrow();
  });
});
