import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentWrite,
} from './appointment';
export interface AppointmentRepository {
  list(access: AppointmentAccess): Promise<readonly AppointmentProjection[]>;
  get(
    access: AppointmentAccess,
    id: string,
  ): Promise<AppointmentProjection | null>;
  validateContext(
    access: AppointmentAccess,
    input: AppointmentWrite,
  ): Promise<void>;
  create(
    access: AppointmentAccess,
    input: AppointmentWrite,
    requestId: string,
  ): Promise<AppointmentProjection>;
  update(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
  ): Promise<AppointmentProjection | null>;
  cancel(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
  ): Promise<AppointmentProjection | null>;
  reschedule(
    access: AppointmentAccess,
    id: string,
    input: AppointmentWrite,
    version: number,
    requestId: string,
  ): Promise<AppointmentProjection | null>;
  auditView(
    access: AppointmentAccess,
    appointments: readonly AppointmentProjection[],
    requestId: string,
  ): Promise<void>;
}
export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
