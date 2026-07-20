import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentStatus,
  AppointmentWrite,
} from './appointment';
export interface AppointmentRepository {
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
  auditView(
    access: AppointmentAccess,
    appointments: readonly AppointmentProjection[],
    requestId: string,
  ): Promise<void>;
}
export interface AppointmentCommand {
  readonly key: string;
  readonly hash: string;
  readonly scope: string;
  readonly responseCode: 200 | 201;
}
export interface AppointmentListQuery {
  readonly from: Date;
  readonly to: Date;
  readonly pageSize: number;
  readonly cursor?: string;
  readonly status?: AppointmentStatus;
}
export interface AppointmentPage {
  readonly items: readonly AppointmentProjection[];
  readonly nextCursor: string | null;
}
export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
