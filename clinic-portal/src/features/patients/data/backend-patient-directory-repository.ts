import "server-only";

import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";

const directoryItemSchema = z.object({ patientProfileId: z.string().uuid(), displayName: z.string(), active: z.boolean(), lastAppointmentAt: z.string().datetime({ offset: true }).nullable(), nextAppointmentAt: z.string().datetime({ offset: true }).nullable() }).strict();
const directoryPageSchema = z.object({ items: z.array(directoryItemSchema), nextCursor: z.string().nullable() }).strict();
const directoryAppointmentSchema = z.object({ appointmentId: z.string().uuid(), doctorId: z.string().uuid(), doctorName: z.string().nullable(), scheduledStartAt: z.string().datetime({ offset: true }), scheduledEndAt: z.string().datetime({ offset: true }), status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "noShow"]), version: z.number().int().min(1) }).strict();
const directoryDetailSchema = z.object({ patientProfileId: z.string().uuid(), displayName: z.string(), active: z.boolean(), appointments: z.object({ upcoming: z.array(directoryAppointmentSchema), recent: z.array(directoryAppointmentSchema) }).strict() }).strict();
export type PatientDirectoryItem = Readonly<z.infer<typeof directoryItemSchema>>;
export type PatientDirectoryDetail = Readonly<z.infer<typeof directoryDetailSchema>>;
export interface PatientDirectoryPage { readonly items: readonly PatientDirectoryItem[]; readonly nextCursor: string | null }

export class BackendPatientDirectoryRepository {
  constructor(private readonly api: BackendApiClient, private readonly session: AuthenticatedSession) {}
  async search(queryText: string, cursor?: string, pageSize = 10): Promise<PatientDirectoryPage> {
    const query = new URLSearchParams({ q: queryText.trim(), pageSize: String(pageSize) });
    if (cursor) query.set("cursor", cursor);
    const result = await this.api.request({ path: `/api/v1/patients/directory?${query}` as `/api/v1/${string}`, session: this.session, schema: directoryPageSchema });
    return Object.freeze({ items: Object.freeze(result.data.items), nextCursor: result.data.nextCursor });
  }
  async get(patientProfileId: string): Promise<PatientDirectoryDetail> {
    return (await this.api.request({ path: `/api/v1/patients/directory/${encodeURIComponent(patientProfileId)}`, session: this.session, schema: directoryDetailSchema })).data;
  }
}
