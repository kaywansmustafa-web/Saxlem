import "server-only";
import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
export const queueStatus = z.enum(["notStarted", "open", "paused", "closed"]),
  entryStatus = z.enum([
    "waiting",
    "called",
    "inConsultation",
    "completed",
    "noResponse",
    "removed",
  ]),
  cursor = z
    .string()
    .min(1)
    .max(512)
    .regex(/^[\x21-\x7e]+$/u);
export const staffEntry = z
  .object({
    entryId: z.string().uuid(),
    queueSessionId: z.string().uuid(),
    appointmentId: z.string().uuid(),
    appointmentReference: z.string().min(1).max(128),
    patientProfileId: z.string().uuid(),
    patientDisplayName: z.string().min(1),
    ticketNumber: z.number().int().min(1),
    status: entryStatus,
    enqueuedAt: z.string().datetime({ offset: true }),
    calledAt: z.string().datetime({ offset: true }).nullable(),
    consultationStartedAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    noResponseAt: z.string().datetime({ offset: true }).nullable(),
    version: z.number().int().min(1),
  })
  .strict();
export const queueSummary = z
  .object({
    id: z.string().uuid(),
    status: queueStatus,
    version: z.number().int().min(1),
    waitingCount: z.number().int().nonnegative(),
    operationalDate: z.string().date(),
    effectiveTimezone: z.string().min(1).max(128),
    currentPatient: staffEntry.nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();
const page = z
    .object({ items: z.array(staffEntry), nextCursor: cursor.nullable() })
    .strict(),
  enqueue = z.object({ entry: staffEntry, queue: queueSummary }).strict();
export type QueueSummary = z.infer<typeof queueSummary>;
export type StaffEntry = z.infer<typeof staffEntry>;
export type QueuePage = z.infer<typeof page>;
export type EnqueueResult = z.infer<typeof enqueue>;
export class BackendQueueRepository {
  constructor(
    private api: BackendApiClient,
    private session: AuthenticatedSession,
  ) {}
  private request<T>(
    path: `/api/v1/${string}`,
    schema: z.ZodType<T>,
    method?: "POST",
    body?: unknown,
    key?: string,
  ) {
    return this.api
      .request({
        path,
        method,
        body,
        idempotencyKey: key,
        session: this.session,
        schema,
      })
      .then((x) => x.data);
  }
  current(clinicId: string, doctorId: string) {
    return this.request(
      `/api/v1/clinics/${encodeURIComponent(clinicId)}/doctors/${encodeURIComponent(doctorId)}/queue-session/current`,
      queueSummary,
    );
  }
  entries(id: string, cursorValue?: string) {
    const query = new URLSearchParams({ pageSize: "25" });
    if (cursorValue) query.set("cursor", cursor.parse(cursorValue));
    return this.request(
      `/api/v1/queue-sessions/${encodeURIComponent(id)}/entries?${query}`,
      page,
    );
  }
  open(clinicId: string, doctorId: string, version: number, key: string) {
    return this.request(
      `/api/v1/clinics/${encodeURIComponent(clinicId)}/doctors/${encodeURIComponent(doctorId)}/queue-sessions/open`,
      queueSummary,
      "POST",
      { version },
      key,
    );
  }
  enqueue(id: string, appointmentId: string, version: number, key: string) {
    return this.request(
      `/api/v1/queue-sessions/${encodeURIComponent(id)}/enqueue`,
      enqueue,
      "POST",
      { appointmentId, version },
      key,
    );
  }
  command(
    id: string,
    operation: "pause" | "resume" | "close" | "call-next",
    version: number,
    key: string,
    reason?: string,
  ) {
    return this.request(
      `/api/v1/queue-sessions/${encodeURIComponent(id)}/${operation}`,
      queueSummary,
      "POST",
      operation === "pause" ? { version, reason } : { version },
      key,
    );
  }
  entry(
    id: string,
    entryId: string,
    operation: "recall" | "no-response",
    sessionVersion: number,
    entryVersion: number,
    key: string,
  ) {
    return this.request(
      `/api/v1/queue-sessions/${encodeURIComponent(id)}/entries/${encodeURIComponent(entryId)}/${operation}`,
      queueSummary,
      "POST",
      { sessionVersion, entryVersion },
      key,
    );
  }
}
