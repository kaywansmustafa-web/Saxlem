export type AppointmentStatus =
  'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
export type AppointmentType = 'initial' | 'followUp';
export interface AppointmentProjection {
  readonly id: string;
  readonly reference: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly clinicName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly patientProfileId: string;
  readonly patientName: string;
  readonly type: AppointmentType;
  readonly reason: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly feeIqd: number;
  readonly status: AppointmentStatus;
  readonly cancellationReason: string | null;
  readonly version: number;
}
export interface AppointmentAccess {
  readonly actorId: string;
  readonly patient: boolean;
  readonly doctor: boolean;
  readonly platformAdministrator: boolean;
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
}
export interface AppointmentWrite {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientProfileId: string;
  readonly type: AppointmentType;
  readonly reason: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly durationMinutes: number;
  readonly feeIqd: number;
}
