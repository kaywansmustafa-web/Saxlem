export interface OtpChallengeRequest {
  readonly normalizedPhoneNumber: string;
  readonly requestIp: string;
}

export interface OtpChallengeResult {
  readonly challengeId: string;
  readonly expiresAt: Date;
}

export interface PatientOtpProvider {
  requestChallenge(request: OtpChallengeRequest): Promise<OtpChallengeResult>;
  verifyChallenge(challengeId: string, otp: string): Promise<boolean>;
}

export interface StaffIdentityProvider {
  verifyCredentials(identifier: string, secret: string): Promise<string | null>;
}

export const PATIENT_OTP_PROVIDER = Symbol('PATIENT_OTP_PROVIDER');
export const STAFF_IDENTITY_PROVIDER = Symbol('STAFF_IDENTITY_PROVIDER');
