import type {
  ArrivalAccess,
  ArrivalCommand,
  ArrivalProjection,
  ArrivalWindowPolicy,
} from './arrival';

export interface ArrivalRepository {
  replay(
    access: ArrivalAccess,
    appointmentId: string,
    command: ArrivalCommand,
  ): Promise<ArrivalProjection | null>;
  get(
    access: ArrivalAccess,
    appointmentId: string,
  ): Promise<ArrivalProjection | null>;
  record(
    access: ArrivalAccess,
    appointmentId: string,
    expectedVersion: number,
    occurredAt: Date,
    requestId: string,
    command: ArrivalCommand,
    window: ArrivalWindowPolicy,
  ): Promise<ArrivalProjection>;
  auditView(
    access: ArrivalAccess,
    arrival: ArrivalProjection,
    requestId: string,
  ): Promise<void>;
}

export const ARRIVAL_REPOSITORY = Symbol('ARRIVAL_REPOSITORY');
