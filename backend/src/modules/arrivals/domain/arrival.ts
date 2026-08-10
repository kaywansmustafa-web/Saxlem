import type { AppointmentAccess } from '../../appointments/domain/appointment';

export type ArrivalStatus = 'expected' | 'arrived' | 'queueReady';
export type ArrivalEligibilityReason =
  | 'eligible'
  | 'tooEarly'
  | 'tooLate'
  | 'invalidAppointmentStatus'
  | 'alreadyArrived'
  | 'queueReady'
  | 'unavailable';
export type ArrivalAccess = AppointmentAccess;

export interface ArrivalEligibility {
  readonly canArrive: boolean;
  readonly reason: ArrivalEligibilityReason;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
}

export interface ArrivalProjection {
  readonly id: string;
  readonly appointmentId: string;
  readonly appointmentReference: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly clinicName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly patientProfileId: string;
  readonly patientName: string;
  readonly appointmentStartsAt: string;
  readonly status: ArrivalStatus;
  readonly arrivedAt: string | null;
  readonly queueReadyAt: string | null;
  readonly version: number;
}

export interface ArrivalCommand {
  readonly key: string;
  readonly scope: string;
  readonly hash: string;
}

export interface ArrivalWindowPolicy {
  readonly earlyMinutes: number;
  readonly lateMinutes: number;
}

export interface ArrivalResponseProjection extends ArrivalProjection {
  readonly arrivalEligibility: ArrivalEligibility;
}

export function deriveArrivalEligibility(input: {
  readonly appointmentStatus: string;
  readonly arrivalStatus: ArrivalStatus;
  readonly startsAt: Date;
  readonly now: Date;
  readonly policy: ArrivalWindowPolicy;
}): ArrivalEligibility {
  const opensAt = new Date(
    input.startsAt.getTime() - input.policy.earlyMinutes * 60_000,
  );
  const closesAt = new Date(
    input.startsAt.getTime() + input.policy.lateMinutes * 60_000,
  );
  const boundariesValid =
    Number.isFinite(input.startsAt.getTime()) &&
    Number.isFinite(input.now.getTime()) &&
    Number.isFinite(opensAt.getTime()) &&
    Number.isFinite(closesAt.getTime());
  const boundaries = boundariesValid
    ? {
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
      }
    : { opensAt: null, closesAt: null };

  if (!['scheduled', 'confirmed'].includes(input.appointmentStatus))
    return Object.freeze({
      canArrive: false,
      reason: 'invalidAppointmentStatus',
      ...boundaries,
    });
  if (input.arrivalStatus === 'queueReady')
    return Object.freeze({
      canArrive: false,
      reason: 'queueReady',
      ...boundaries,
    });
  if (input.arrivalStatus === 'arrived')
    return Object.freeze({
      canArrive: false,
      reason: 'alreadyArrived',
      ...boundaries,
    });
  if (!boundariesValid)
    return Object.freeze({
      canArrive: false,
      reason: 'unavailable',
      opensAt: null,
      closesAt: null,
    });
  if (input.now.getTime() < opensAt.getTime())
    return Object.freeze({
      canArrive: false,
      reason: 'tooEarly',
      ...boundaries,
    });
  if (input.now.getTime() > closesAt.getTime())
    return Object.freeze({
      canArrive: false,
      reason: 'tooLate',
      ...boundaries,
    });
  return Object.freeze({ canArrive: true, reason: 'eligible', ...boundaries });
}
