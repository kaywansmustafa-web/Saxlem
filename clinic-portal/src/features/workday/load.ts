import "server-only";

import type { BackendAppointment, BackendAppointmentRepository } from "@/features/appointments/data/backend-appointment-repository";
import type { BackendQueueRepository, QueueSummary, StaffEntry } from "@/features/live-queue/data/backend-queue-repository";
import { PortalApiError } from "@/infrastructure/api/api-error";

/** Every appointment in a window (the API pages 50 at a time). */
export async function allAppointments(
  repository: BackendAppointmentRepository,
  from: string,
  to: string,
): Promise<BackendAppointment[]> {
  const items: BackendAppointment[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 10; page++) {
    const result = await repository.list({ from, to, pageSize: 50, cursor });
    items.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export interface QueueView {
  readonly summary: QueueSummary;
  readonly entries: readonly StaffEntry[];
}

/** Today's queue for one doctor, or null when it hasn't been opened. */
export async function currentQueue(
  queues: BackendQueueRepository,
  clinicId: string,
  doctorId: string,
): Promise<QueueView | null> {
  let summary: QueueSummary;
  try {
    summary = await queues.current(clinicId, doctorId);
  } catch (error) {
    if (error instanceof PortalApiError && error.detail.status === 404) return null;
    throw error;
  }
  const entries: StaffEntry[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 8; page++) {
    const result = await queues.entries(summary.id, cursor);
    entries.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return { summary, entries: entries.sort((a, b) => a.ticketNumber - b.ticketNumber) };
}
