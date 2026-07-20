import type { AppointmentAccess } from '../../appointments/domain/appointment';

export type ArrivalStatus = 'expected' | 'arrived' | 'queueReady';
export type ArrivalAccess = AppointmentAccess;

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
