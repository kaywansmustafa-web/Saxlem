export interface OtpDeliveryProvider {
  deliver(phone: string, otp: string): Promise<void>;
}
export interface PasskeyProvider {
  verify(assertion: unknown): Promise<string | null>;
}
export interface SsoProvider {
  verify(assertion: unknown): Promise<string | null>;
}
export interface MagicLinkProvider {
  verify(token: string): Promise<string | null>;
}
export type RateLimitAction =
  'otpRequest' | 'otpVerify' | 'login' | 'refresh' | 'logout' | 'logoutAll';
export interface RateLimitBoundary {
  consume(
    key: string,
    action: RateLimitAction,
    dimension?: 'subject' | 'network',
  ): Promise<boolean>;
}
export const RATE_LIMIT_BOUNDARY = Symbol('RATE_LIMIT_BOUNDARY');
