import "server-only";
import { z } from "zod";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";

const viewSchema = z
  .object({
    doctors: z.array(
      z
        .object({
          id: z.string().uuid(),
          displayName: z.string(),
          assigned: z.boolean(),
        })
        .strict(),
    ),
    configured: z.boolean(),
  })
  .strict();
export type ReceptionDoctors = Readonly<z.infer<typeof viewSchema>>;

/** The doctors a receptionist works for (usually one). */
export class BackendReceptionDoctors {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}

  /** Null for staff who are not receptionists (clinic managers). */
  async view(): Promise<ReceptionDoctors | null> {
    if (this.session.role !== "receptionist") return null;
    return (
      await this.api.request({
        path: "/api/v1/reception/doctors",
        session: this.session,
        schema: viewSchema,
      })
    ).data;
  }

  async update(doctorIds: readonly string[]): Promise<ReceptionDoctors> {
    return (
      await this.api.request({
        path: "/api/v1/reception/doctors",
        method: "PUT",
        session: this.session,
        body: { doctorIds },
        schema: viewSchema,
      })
    ).data;
  }
}
