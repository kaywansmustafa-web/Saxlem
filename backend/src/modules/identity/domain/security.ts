import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import * as argon2 from 'argon2';

export const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
});

export const hashOpaqueToken = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
export const randomOpaqueToken = (): string =>
  randomBytes(48).toString('base64url');
export const randomOtp = (): string =>
  String(randomInt(0, 1_000_000)).padStart(6, '0');
export const hashOtp = (phone: string, otp: string, secret: string): string =>
  createHmac('sha256', secret).update(`${phone}:${otp}`).digest('hex');
export const keyedHash = (
  purpose: string,
  value: string,
  secret: string,
): string =>
  createHmac('sha256', secret).update(`${purpose}:${value}`).digest('hex');
export function safeEqualHex(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
export const hashPassword = (password: string): Promise<string> => {
  assertPasswordPolicy(password);
  return argon2.hash(password, ARGON2_OPTIONS);
};
export const verifyPassword = (
  hash: string,
  password: string,
): Promise<boolean> => argon2.verify(hash, password);
export const passwordNeedsRehash = (hash: string): boolean =>
  argon2.needsRehash(hash, ARGON2_OPTIONS);
export function assertPasswordPolicy(password: string): void {
  if (password.length < 12 || new Set(password).size < 8)
    throw new Error('Password does not meet security policy.');
}
export interface BreachedPasswordChecker {
  isBreached(password: string): Promise<boolean>;
}
