import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { axe } from "jest-axe";
import { BackendDoctorDirectory } from "@/features/live-queue/data/backend-doctor-directory";
import {
  BackendQueueRepository,
  queueSummary,
  staffEntry,
} from "@/features/live-queue/data/backend-queue-repository";
import { ProductionQueueWorkspace } from "@/features/live-queue/presentation/production-queue-workspace";
import { productionQueueMessages } from "@/features/live-queue/presentation/production-messages";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    if (this.open) throw new DOMException("Dialog is already open");
    this.setAttribute("open", "");
    this.addEventListener("keydown", (event) => {
      if ((event as KeyboardEvent).key !== "Escape") return;
      const cancel = new Event("cancel", { cancelable: true });
      if (this.dispatchEvent(cancel)) this.close();
    });
  };
  HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  session = { context: { organizationId: id(1), clinicId: id(2) } } as never,
  entry = {
    entryId: id(5),
    queueSessionId: id(4),
    appointmentId: id(6),
    appointmentReference: "SX-2026-000001",
    patientProfileId: id(7),
    patientDisplayName: "Safe Patient",
    ticketNumber: 1,
    status: "waiting" as const,
    enqueuedAt: "2026-08-03T08:00:00Z",
    calledAt: null,
    consultationStartedAt: null,
    completedAt: null,
    noResponseAt: null,
    version: 1,
  },
  queue = {
    id: id(4),
    status: "open" as const,
    version: 2,
    waitingCount: 1,
    operationalDate: "2026-08-03",
    effectiveTimezone: "Asia/Baghdad",
    currentPatient: null,
    updatedAt: "2026-08-03T08:01:00Z",
  };
describe("production queue adapters", () => {
  it("validates clinic-scoped active doctors", async () => {
    const request = vi.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: id(3),
              displayName: "Doctor",
              fullName: "Doctor",
              specialty: "Care",
              gender: "unspecified",
              status: "active",
              yearsOfExperience: 1,
              languages: ["en"],
              profileImageUrl: null,
              clinics: [{ id: id(2), name: "Clinic" }],
              availability: {
                status: "available",
                acceptingNewPatients: true,
                nextAvailableAt: null,
                updatedAt: null,
              },
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      }),
      repo = new BackendDoctorDirectory({ request } as never, session);
    expect(await repo.list(id(2))).toEqual([
      { id: id(3), displayName: "Doctor" },
    ]);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        session,
        path: expect.stringContaining(`clinicId=${id(2)}`),
      }),
    );
  });
  it("traverses all doctor pages and deduplicates exact-clinic doctors", async () => {
    const item = {
      id: id(3),
      displayName: "Doctor",
      fullName: "Doctor",
      specialty: "Care",
      gender: "unspecified",
      status: "active",
      yearsOfExperience: 1,
      languages: ["en"],
      profileImageUrl: null,
      clinics: [{ id: id(2), name: "Clinic" }],
      availability: {
        status: "available",
        acceptingNewPatients: true,
        nextAvailableAt: null,
        updatedAt: null,
      },
    };
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          items: [item],
          page: 1,
          pageSize: 100,
          total: 2,
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [item, { ...item, id: id(8), displayName: "Second" }],
          page: 2,
          pageSize: 100,
          total: 2,
          totalPages: 2,
        },
      });
    const result = await new BackendDoctorDirectory(
      { request } as never,
      session,
    ).list(id(2));
    expect(result).toEqual([
      { id: id(3), displayName: "Doctor" },
      { id: id(8), displayName: "Second" },
    ]);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("rejects a repeated or stale doctor page number", async () => {
    const request = vi.fn().mockResolvedValue({
      data: { items: [], page: 1, pageSize: 100, total: 2100, totalPages: 21 },
    });
    await expect(
      new BackendDoctorDirectory({ request } as never, session).list(id(2)),
    ).rejects.toThrow(/repeated or stale page/i);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("stops doctor traversal after the 20-page safety bound", async () => {
    let number = 0;
    const request = vi.fn().mockImplementation(() => {
      number += 1;
      return Promise.resolve({
        data: {
          items: [],
          page: number,
          pageSize: 100,
          total: 2100,
          totalPages: 21,
        },
      });
    });
    await expect(
      new BackendDoctorDirectory({ request } as never, session).list(id(2)),
    ).rejects.toThrow(/safe pagination bound/i);
    expect(request).toHaveBeenCalledTimes(20);
  });
  it("forwards queue versions and idempotency and validates authoritative enqueue", async () => {
    const request = vi.fn().mockResolvedValue({ data: { entry, queue } }),
      repo = new BackendQueueRepository({ request } as never, session);
    expect(await repo.enqueue(id(4), id(6), 2, "key")).toEqual({
      entry,
      queue,
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { appointmentId: id(6), version: 2 },
        idempotencyKey: "key",
        session,
      }),
    );
  });
  it("rejects unsafe fields and malformed queue contracts", () => {
    expect(staffEntry.safeParse({ ...entry, phone: "+964" }).success).toBe(
      false,
    );
    expect(queueSummary.safeParse({ ...queue, version: 1.5 }).success).toBe(
      false,
    );
  });
});
describe("queue UI", () => {
  it("renders a semantic privacy-safe queue and arrival separation", async () => {
    const view = render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: null }}
        appointmentId={id(6)}
      />,
    );
    expect(screen.getByRole("table")).toHaveTextContent("Safe Patient");
    expect(
      screen.getByText(productionQueueMessages("en").queueSeparate),
    ).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(
      /phone|date of birth|address|reason/i,
    );
    expect((await axe(view.container)).violations).toHaveLength(0);
  });
  it("confirms an enqueue and announces its authoritative result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { entry: { ...entry, ticketNumber: 7 } },
        }),
      }),
    );
    render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: null }}
        appointmentId={id(6)}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").enqueue,
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const status = (await screen.findByText(/Ticket assigned: 7/)).closest(
      '[role="status"]',
    )!;
    await waitFor(() => expect(status).toHaveFocus());
    vi.unstubAllGlobals();
  });
  it("returns focus on cancel and blocks Escape and Cancel while pending", async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: null }}
        appointmentId={id(6)}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: productionQueueMessages("en").enqueue,
    });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: productionQueueMessages("en").cancel,
      }),
    ).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ result: { entry } }) });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("binds retries to one operation ID and abandons it on cancellation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: {} }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: null }}
        appointmentId={id(6)}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: productionQueueMessages("en").pause }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await screen.findByText(productionQueueMessages("en").conflict);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const first = JSON.parse(String(fetchMock.mock.calls[0]![1]?.body));
    const retry = JSON.parse(String(fetchMock.mock.calls[1]![1]?.body));
    expect(retry.operationId).toBe(first.operationId);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").cancel,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").enqueue,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const next = JSON.parse(String(fetchMock.mock.calls[2]![1]?.body));
    expect(next.operationId).not.toBe(first.operationId);
  });
  it("creates a new operation ID when an idle confirmation is cancelled and reopened", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: {} }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: null }}
      />,
    );
    const pause = screen.getByRole("button", {
      name: productionQueueMessages("en").pause,
    });
    fireEvent.click(pause);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await screen.findByText(productionQueueMessages("en").conflict);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").cancel,
      }),
    );
    fireEvent.click(pause);
    fireEvent.click(
      screen.getByRole("button", {
        name: productionQueueMessages("en").confirm,
      }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const ids = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1]?.body)).operationId,
    );
    expect(ids[1]).not.toBe(ids[0]);
  });
  it("retains and deduplicates entries when appending, then retains them on failure", async () => {
    const second = { ...entry, entryId: id(9), ticketNumber: 2 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: { items: [entry, second], nextCursor: "next-2" },
        }),
      })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProductionQueueWorkspace
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={queue}
        page={{ items: [entry], nextCursor: "next-1" }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: productionQueueMessages("en").next }),
    );
    await screen.findByText("2");
    expect(screen.getAllByText("Safe Patient")).toHaveLength(2);
    fireEvent.click(
      screen.getByRole("button", { name: productionQueueMessages("en").next }),
    );
    await screen.findByText(productionQueueMessages("en").paginationError);
    expect(screen.getAllByText("Safe Patient")).toHaveLength(2);
    vi.unstubAllGlobals();
  });
  it("blocks duplicate pagination and ignores a response after queue selection changes", async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const renderWorkspace = (value: typeof queue) => (
      <ProductionQueueWorkspace
        key={value.id}
        locale="en"
        m={productionQueueMessages("en")}
        doctors={[{ id: id(3), displayName: "Doctor" }]}
        doctorId={id(3)}
        queue={value}
        page={{ items: [entry], nextCursor: "opaque" }}
      />
    );
    const view = render(renderWorkspace(queue));
    const next = screen.getByRole("button", {
      name: productionQueueMessages("en").next,
    });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const replacement = { ...queue, id: id(10), waitingCount: 0 };
    view.rerender(renderWorkspace(replacement));
    resolve({
      ok: true,
      json: async () => ({
        page: {
          items: [
            { ...entry, entryId: id(11), patientDisplayName: "Stale Patient" },
          ],
          nextCursor: null,
        },
      }),
    });
    await waitFor(() =>
      expect(screen.queryByText("Stale Patient")).not.toBeInTheDocument(),
    );
  });
});
