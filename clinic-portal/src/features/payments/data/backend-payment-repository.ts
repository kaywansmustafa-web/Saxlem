import "server-only";

import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";

export const paymentStatusSchema = z.enum([
  "dueAtCounter",
  "pending",
  "paid",
  "expired",
  "cancelled",
  "refundPending",
  "refunded",
  "refundFailed",
  "void",
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const backendPaymentSchema = z
  .object({
    appointmentId: z.string().uuid(),
    method: z.enum(["counter", "online"]),
    status: paymentStatusSchema,
    amountIqd: z.number().int().positive(),
    currency: z.literal("IQD"),
    provider: z.enum(["fib", "simulated"]).nullable(),
    onlineAvailable: z.boolean(),
    // Reception never needs the patient's payment link or QR code.
    online: z.unknown().nullable(),
    paidAt: z.string().datetime({ offset: true }).nullable(),
    refundedAt: z.string().datetime({ offset: true }).nullable(),
    version: z.number().int().min(0),
  })
  .strict();

export type BackendPayment = Readonly<z.infer<typeof backendPaymentSchema>>;

const listSchema = z.object({ items: z.array(backendPaymentSchema) }).strict();

export class BackendPaymentRepository {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}

  async get(appointmentId: string): Promise<BackendPayment> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(appointmentId)}/payment`,
        session: this.session,
        schema: backendPaymentSchema,
      })
    ).data;
  }

  /** Payments for up to 100 appointments; missing ones are paid at the counter. */
  async list(
    appointmentIds: readonly string[],
  ): Promise<ReadonlyMap<string, BackendPayment>> {
    if (!appointmentIds.length) return new Map();
    const query = appointmentIds
      .slice(0, 100)
      .map((id) => `appointmentId=${encodeURIComponent(id)}`)
      .join("&");
    const { items } = (
      await this.api.request({
        path: `/api/v1/payments?${query}`,
        session: this.session,
        schema: listSchema,
      })
    ).data;
    return new Map(items.map((item) => [item.appointmentId, item]));
  }

  async recordCounter(appointmentId: string): Promise<BackendPayment> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(appointmentId)}/payment/counter`,
        method: "POST",
        session: this.session,
        schema: backendPaymentSchema,
      })
    ).data;
  }
}
