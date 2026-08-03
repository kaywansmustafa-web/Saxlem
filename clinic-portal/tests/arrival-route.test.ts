import { beforeEach, describe, expect, it, vi } from "vitest";
const record = vi.fn();
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({ arrivals: { record } })),
}));
import { POST } from "@/app/api/appointments/[appointmentId]/arrival/route";
const origin = "https://portal.example",
  appointmentId = "00000000-0000-4000-8000-000000000001";
const request = (
  body: string,
  contentType = "application/json",
  requestOrigin = origin,
) =>
  new Request(`${origin}/api/appointments/${appointmentId}/arrival`, {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": contentType },
    body,
  });
beforeEach(() => {
  record
    .mockReset()
    .mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000002",
      appointmentId,
      status: "queueReady",
      version: 2,
    });
});
describe("arrival BFF", () => {
  it("validates and forwards a server-scoped idempotency key", async () => {
    const operationId = "00000000-0000-4000-8000-000000000009",
      response = await POST(
        request(JSON.stringify({ version: 3, operationId })),
        { params: Promise.resolve({ appointmentId }) },
      );
    expect(response.status).toBe(200);
    expect(record).toHaveBeenCalledWith(
      appointmentId,
      3,
      `portal-arrival-${operationId}`,
    );
    expect(JSON.stringify(await response.json())).not.toMatch(
      /token|authorization|organizationId|clinicId/i,
    );
  });
  it.each([
    [
      "bad",
      JSON.stringify({
        version: 1,
        operationId: "00000000-0000-4000-8000-000000000009",
      }),
      "application/json",
    ],
    [appointmentId, "{", "application/json"],
    [appointmentId, "{}", "application/json"],
    [
      appointmentId,
      JSON.stringify({
        version: 1,
        operationId: "00000000-0000-4000-8000-000000000009",
      }),
      "text/plain",
    ],
  ])(
    "rejects invalid UUID, JSON, body, or content type",
    async (id, body, type) => {
      const response = await POST(request(body, type), {
        params: Promise.resolve({ appointmentId: id }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "PORTAL_VALIDATION_FAILED" },
      });
      expect(record).not.toHaveBeenCalled();
    },
  );
  it("rejects cross-origin before composition", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          version: 1,
          operationId: "00000000-0000-4000-8000-000000000009",
        }),
        "application/json",
        "https://evil.example",
      ),
      { params: Promise.resolve({ appointmentId }) },
    );
    expect(response.status).toBe(403);
    expect(record).not.toHaveBeenCalled();
  });
});
