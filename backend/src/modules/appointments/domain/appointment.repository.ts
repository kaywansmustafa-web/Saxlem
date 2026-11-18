import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentStatus,
  AppointmentWrite,
} from './appointment';
export interface AppointmentRepository {
  /** The doctor's own fee for this kind of visit, or null for the default. */
  doctorFee(
    doctorId: string,
    type: 'initial' | 'followUp',
  ): Promise<number | null>;
  /** True while a doctor is hidden from the patient app for an overdue
   * Saxlem balance. */
  hiddenFromApp(doctorId: string): Promise<boolean>;
  replay(
    access: AppointmentAccess,
    command: AppointmentCommand,
  ): Promise<AppointmentProjection | null>;
  list(
    access: AppointmentAccess,
    query: AppointmentListQuery,
  ): Promise<AppointmentPage>;
  get(
    access: AppointmentAccess,
    id: string,
  ): Promise<AppointmentProjection | null>;
  validateContext(
    access: AppointmentAccess,
    input: AppointmentWrite,
  ): Promise<void>;
  findBookingConflicts(
    input: BookingConflictQuery,
  ): Promise<readonly BookingConflict[]>;
  create(
    access: AppointmentAccess,
    input: AppointmentWrite,
    requestId: string,
    command: AppointmentCommand,
    validate: () => Promise<void>,
  ): Promise<AppointmentProjection>;
  update(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
    command: AppointmentCommand,
  ): Promise<AppointmentProjection | null>;
  cancel(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
    command: AppointmentCommand,
  ): Promise<AppointmentProjection | null>;
  reschedule(
    access: AppointmentAccess,
    id: string,
    input: AppointmentWrite,
    version: number,
    requestId: string,
    command: AppointmentCommand,
    validate: () => Promise<void>,
  ): Promise<AppointmentProjection | null>;
  /** Active doctors assigned to the clinic, for reception's day board. */
  clinicDoctors(
    organizationId: string,
    clinicId: string,
  ): Promise<readonly { readonly id: string; readonly displayName: string }[]>;
  /** Every non-cancelled appointment at the clinic in [from, to). */
  dayAppointments(
    organizationId: string,
    clinicId: string,
    from: Date,
    to: Date,
  ): Promise<readonly AppointmentProjection[]>;
  auditView(
    access: AppointmentAccess,
    appointments: readonly AppointmentProjection[],
    requestId: string,
  ): Promise<void>;
}
export interface BookingConflictQuery {
  readonly organizationId: string;
  readonly doctorId: string;
  readonly patientProfileId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}
export interface BookingConflict {
  readonly startsAt: string;
  readonly endsAt: string;
}
export interface AppointmentCommand {
  readonly key: string;
  readonly hash: string;
  readonly scope: string;
  readonly responseCode: 200 | 201;
}
export interface AppointmentListQuery {
  readonly patientProfileId?: string;
  readonly from: Date;
  readonly to: Date;
  readonly pageSize: number;
  readonly cursor?: string;
  readonly status?: AppointmentStatus;
  /** Limits results to these doctors (a receptionist's own doctors). */
  readonly doctorIds?: readonly string[];
}
export interface AppointmentPage {
  readonly items: readonly AppointmentProjection[];
  readonly nextCursor: string | null;
}
export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
