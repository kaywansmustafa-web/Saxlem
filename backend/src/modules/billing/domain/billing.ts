export const BILLING_ACTIVATION_AT = new Date('2026-08-10T00:00:00.000Z');
export const STANDARD_BILLING_PLAN_ID = '0198a4ae-1250-7000-8000-000000000001';
export const BILLING_TIMEZONE = 'Asia/Baghdad';

export interface BillingAccess {
  readonly actorId: string;
  readonly platformAdministrator: boolean;
  readonly organizationId?: string;
  readonly clinicId?: string;
}

export interface BillingCursor {
  readonly recognizedAt: Date;
  readonly id: string;
}

export interface BillingCommand {
  readonly key: string;
  readonly hash: string;
  readonly scope: string;
}

export interface BillingPeriod {
  readonly start: Date;
  readonly end: Date;
}
