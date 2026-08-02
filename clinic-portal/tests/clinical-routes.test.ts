import { beforeEach, describe, expect, it, vi } from "vitest";
const cancel = vi.fn(),
  reschedule = vi.fn(),
  search = vi.fn();
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({
    appointments: { cancel, reschedule },
    patients: { search },
  })),
}));
import { POST as cancelRoute } from "@/app/api/appointments/[appointmentId]/cancel/route";
import { POST as rescheduleRoute } from "@/app/api/appointments/[appointmentId]/reschedule/route";
import { POST as patientRoute } from "@/app/api/patients/search/route";
const origin = "https://portal.example";
const appointmentId = "00000000-0000-4000-8000-000000000009";
const request = (
  path: string,
  body: unknown,
  headers: Record<string, string> = { origin },
) =>
  new Request(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  const result = {
    id: "00000000-0000-4000-8000-000000000001",
    version: 2,
    status: "confirmed",
  };
  cancel.mockResolvedValue(result);
  reschedule.mockResolvedValue(result);
  search.mockResolvedValue({ items: [], nextCursor: null });
});
describe("clinical BFF routes", () => {
  it("rejects cross-origin mutations before repository access", async () => {
    const response = await cancelRoute(
      request(
        "/api/appointments/x/cancel",
        {},
        { origin: "https://evil.example" },
      ),
      { params: Promise.resolve({ appointmentId: "x" }) },
    );
    expect(response.status).toBe(403);
    expect(cancel).not.toHaveBeenCalled();
  });
  it("forwards cancellation concurrency data", async () => {
    const body = {
        reason: "Patient request",
        version: 1,
        operationId: "00000000-0000-4000-8000-000000000002",
      },
      response = await cancelRoute(
        request(`/api/appointments/${appointmentId}/cancel`, body),
        { params: Promise.resolve({ appointmentId }) },
      );
    expect(response.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith(
      appointmentId,
      expect.objectContaining({ version: 1, idempotencyKey: body.operationId }),
    );
  });
  it("forwards rescheduling concurrency data", async () => {
    const body = {
        startsAt: "2026-08-03T10:00:00.000Z",
        durationMinutes: 30,
        version: 1,
        operationId: "00000000-0000-4000-8000-000000000002",
      },
      response = await rescheduleRoute(
        request(`/api/appointments/${appointmentId}/reschedule`, body),
        { params: Promise.resolve({ appointmentId }) },
      );
    expect(response.status).toBe(200);
    expect(reschedule).toHaveBeenCalledWith(
      appointmentId,
      expect.objectContaining({ version: 1, idempotencyKey: body.operationId }),
    );
  });
  it.each(["cancel", "reschedule"])(
    "rejects invalid appointment UUID for %s",
    async (operation) => {
      const route = operation === "cancel" ? cancelRoute : rescheduleRoute,
        response = await route(
          request(
            `/api/appointments/bad/${operation}`,
            operation === "cancel"
              ? {
                  reason: "reason",
                  version: 1,
                  operationId: "00000000-0000-4000-8000-000000000002",
                }
              : {
                  startsAt: "2026-08-03T10:00:00+03:00",
                  durationMinutes: 30,
                  version: 1,
                  operationId: "00000000-0000-4000-8000-000000000002",
                },
          ),
          { params: Promise.resolve({ appointmentId: "bad" }) },
        );
      expect(response.status).toBe(400);
      expect(
        operation === "cancel" ? cancel : reschedule,
      ).not.toHaveBeenCalled();
    },
  );
  it("rejects wrong content type and malformed JSON as sanitized validation errors", async () => {
    const wrong = new Request(
        `${origin}/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { origin, "content-type": "text/plain" },
          body: "{}",
        },
      ),
      malformed = new Request(
        `${origin}/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: "{",
        },
      );
    for (const candidate of [wrong, malformed]) {
      const response = await cancelRoute(candidate, {
        params: Promise.resolve({ appointmentId }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "PORTAL_VALIDATION_FAILED" },
      });
    }
    expect(cancel).not.toHaveBeenCalled();
  });
  it("keeps patient terms in a same-origin POST body", async () => {
    const response = await patientRoute(
      request("/api/patients/search", { query: "Ava" }),
    );
    expect(response.status).toBe(200);
    expect(search).toHaveBeenCalledWith("Ava", undefined);
  });
});
