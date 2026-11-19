import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const recordCounter = vi.fn();
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({ payments: { recordCounter } })),
}));
import { POST } from "@/app/api/appointments/[appointmentId]/payment/counter/route";
import { backendPaymentSchema } from "@/features/payments/data/backend-payment-repository";
import {
  paymentMessages,
  paymentTone,
} from "@/features/payments/presentation/messages";

const origin = "https://portal.example",
  appointmentId = "00000000-0000-4000-8000-000000000001";
const payment = {
  appointmentId,
  method: "counter",
  status: "paid",
  amountIqd: 25000,
  currency: "IQD",
  provider: null,
  onlineAvailable: false,
  online: null,
  paidAt: "2026-11-17T09:00:00.000Z",
  refundedAt: null,
  version: 1,
};
const request = (requestOrigin = origin) =>
  new Request(`${origin}/api/appointments/${appointmentId}/payment/counter`, {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": "application/json" },
    body: "{}",
  });

beforeEach(() => {
  recordCounter.mockReset().mockResolvedValue(payment);
});

describe("counter payment BFF", () => {
  it("records a counter payment for a valid appointment", async () => {
    const response = await POST(request(), {
      params: Promise.resolve({ appointmentId }),
    });
    expect(response.status).toBe(200);
    expect(recordCounter).toHaveBeenCalledWith(appointmentId);
  });

  it("rejects other origins and invalid ids", async () => {
    expect(
      (
        await POST(request("https://evil.example"), {
          params: Promise.resolve({ appointmentId }),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await POST(request(), {
          params: Promise.resolve({ appointmentId: "x" }),
        })
      ).status,
    ).toBe(400);
    expect(recordCounter).not.toHaveBeenCalled();
  });
});

describe("payment contract and copy", () => {
  it("accepts the backend payment shape and rejects unknown fields", () => {
    expect(backendPaymentSchema.parse(payment).status).toBe("paid");
    expect(() =>
      backendPaymentSchema.parse({ ...payment, clientSecret: "x" }),
    ).toThrow();
  });

  it("has the same messages in every language, all filled in", () => {
    const en = paymentMessages("en");
    for (const locale of ["ar", "ku"] as const) {
      const other = paymentMessages(locale);
      expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(other)) {
        expect(value, `${locale}.${key}`).not.toBe("");
        if (key === "markPaidBody") expect(value).toContain("{amount}");
      }
    }
  });

  it("colours statuses by meaning", () => {
    expect(paymentTone("paid")).toBe("positive");
    expect(paymentTone("pending")).toBe("info");
    expect(paymentTone("refundFailed")).toBe("warning");
    expect(paymentTone("dueAtCounter")).toBe("neutral");
  });
});
