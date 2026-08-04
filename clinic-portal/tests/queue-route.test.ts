import { beforeEach, describe, expect, it, vi } from "vitest";
const command = vi.fn(),
  open = vi.fn(),
  enqueue = vi.fn(),
  entry = vi.fn(),
  entries = vi.fn();
let mockRole: "receptionist" | "clinicManager" | "doctor" | null =
  "receptionist";
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => {
    const { PortalApiError } = await import("@/infrastructure/api/api-error");
    if (!mockRole)
      throw new PortalApiError({
        kind: "unauthorized",
        status: 401,
        code: "PORTAL_SESSION_REQUIRED",
        message: "Authentication is required.",
        retryable: false,
      });
    if (mockRole !== "receptionist" && mockRole !== "clinicManager")
      throw new PortalApiError({
        kind: "forbidden",
        status: 403,
        code: "PORTAL_CLINICAL_ACCESS_FORBIDDEN",
        message: "Access is forbidden.",
        retryable: false,
      });
    return {
      context: {
        organizationId: "00000000-0000-4000-8000-000000000001",
        clinicId: "00000000-0000-4000-8000-000000000002",
      },
      queues: { command, open, enqueue, entry, entries },
    };
  }),
}));
import { POST } from "@/app/api/queue/commands/route";
import { POST as PAGE } from "@/app/api/queue/entries/route";
const origin = "https://portal.example",
  uuid = "00000000-0000-4000-8000-000000000009",
  req = (body: string, type = "application/json", from = origin) =>
    new Request(`${origin}/api/queue/commands`, {
      method: "POST",
      headers: { origin: from, "content-type": type },
      body,
    });
beforeEach(() => {
  vi.clearAllMocks();
  mockRole = "receptionist";
  command.mockResolvedValue({ id: uuid });
  open.mockResolvedValue({ id: uuid });
  enqueue.mockResolvedValue({ entry: { ticketNumber: 1 } });
  entry.mockResolvedValue({ id: uuid });
  entries.mockResolvedValue({ items: [], nextCursor: null });
});
describe("queue BFF", () => {
  it("forwards optimistic versions with a server-scoped idempotency key", async () => {
    const response = await POST(
      req(
        JSON.stringify({
          operation: "pause",
          queueId: uuid,
          version: 4,
          operationId: uuid,
        }),
      ),
    );
    expect(response.status).toBe(200);
    expect(command).toHaveBeenCalledWith(
      uuid,
      "pause",
      4,
      `portal-queue-${uuid}`,
      undefined,
    );
  });
  it.each([
    ["{", "application/json", origin],
    ["{}", "application/json", origin],
    [
      JSON.stringify({
        operation: "pause",
        queueId: "bad",
        version: 1,
        operationId: uuid,
      }),
      "application/json",
      origin,
    ],
    [
      JSON.stringify({
        operation: "pause",
        queueId: uuid,
        version: 1,
        operationId: uuid,
      }),
      "text/plain",
      origin,
    ],
  ])("rejects malformed requests", async (body, type, from) => {
    expect((await POST(req(body, type, from))).status).toBe(400);
    expect(command).not.toHaveBeenCalled();
  });
  it("rejects cross-origin before composition", async () => {
    expect(
      (
        await POST(
          req(
            JSON.stringify({
              operation: "pause",
              queueId: uuid,
              version: 1,
              operationId: uuid,
            }),
            "application/json",
            "https://evil.example",
          ),
        )
      ).status,
    ).toBe(403);
    expect(command).not.toHaveBeenCalled();
  });
  it("loads an opaque cursor for the exact queue through the sealed-session composition", async () => {
    const cursor = "signed.opaque-cursor";
    const response = await PAGE(
      new Request(`${origin}/api/queue/entries`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ queueId: uuid, cursor }),
      }),
    );
    expect(response.status).toBe(200);
    expect(entries).toHaveBeenCalledWith(uuid, cursor);
  });
  it.each(["receptionist", "clinicManager"] as const)(
    "permits the %s sealed-session role",
    async (role) => {
      mockRole = role;
      expect(
        (
          await POST(
            req(
              JSON.stringify({
                operation: "pause",
                queueId: uuid,
                version: 1,
                operationId: uuid,
              }),
            ),
          )
        ).status,
      ).toBe(200);
    },
  );
  it.each([
    [null, 401],
    ["doctor", 403],
  ] as const)("rejects the %s sealed-session role", async (role, status) => {
    mockRole = role;
    const response = await POST(
      req(
        JSON.stringify({
          operation: "pause",
          queueId: uuid,
          version: 1,
          operationId: uuid,
        }),
      ),
    );
    expect(response.status).toBe(status);
    expect(command).not.toHaveBeenCalled();
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        }),
      }),
    );
  });
  it("strictly rejects browser-supplied organization and clinic fields", async () => {
    const response = await POST(
      req(
        JSON.stringify({
          operation: "pause",
          queueId: uuid,
          version: 1,
          operationId: uuid,
          organizationId: uuid,
          clinicId: uuid,
        }),
      ),
    );
    expect(response.status).toBe(400);
    expect(command).not.toHaveBeenCalled();
  });
  it.each(["receptionist", "clinicManager"] as const)(
    "permits %s queue pagination through the sealed-session boundary",
    async (role) => {
      mockRole = role;
      const response = await PAGE(
        new Request(`${origin}/api/queue/entries`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({ queueId: uuid, cursor: "opaque" }),
        }),
      );
      expect(response.status).toBe(200);
      expect(entries).toHaveBeenCalledWith(uuid, "opaque");
    },
  );
  it.each([
    [null, 401],
    ["doctor", 403],
  ] as const)("rejects %s queue pagination", async (role, status) => {
    mockRole = role;
    const response = await PAGE(
      new Request(`${origin}/api/queue/entries`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ queueId: uuid, cursor: "opaque" }),
      }),
    );
    expect(response.status).toBe(status);
    expect(entries).not.toHaveBeenCalled();
  });
  it("rejects browser tenant fields on queue pagination", async () => {
    const response = await PAGE(
      new Request(`${origin}/api/queue/entries`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({
          queueId: uuid,
          cursor: "opaque",
          organizationId: uuid,
          clinicId: uuid,
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(entries).not.toHaveBeenCalled();
  });
});
