import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatientDirectoryPageView } from "@/features/patients/presentation/patient-directory-page";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
const m = clinicalMessages("en"),
  item = (id: string, name: string) => ({
    patientProfileId: id,
    displayName: name,
    active: true,
    lastAppointmentAt: null,
    nextAppointmentAt: null,
  }),
  response = (page: unknown) =>
    new Response(JSON.stringify({ page }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  deferred = () => {
    let resolve!: (value: Response) => void;
    return { promise: new Promise<Response>((r) => (resolve = r)), resolve };
  };
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("patient pagination", () => {
  it("uses submitted query after editable input changes", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response({ items: [], nextCursor: null }));
    render(
      <PatientDirectoryPageView
        page={{
          items: [item("00000000-0000-4000-8000-000000000001", "Ava")],
          nextCursor: "next",
        }}
        query="Ava"
        locale="en"
        m={m}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: m.next }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({
      query: "Ava",
      cursor: "next",
    });
  });
  it("ignores stale rapid-search responses", async () => {
    const first = deferred(),
      second = deferred();
    vi.spyOn(globalThis, "fetch")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<PatientDirectoryPageView locale="en" m={m} />);
    const input = screen.getByRole("searchbox"),
      form = input.closest("form")!;
    fireEvent.change(input, { target: { value: "Ava" } });
    fireEvent.submit(form);
    fireEvent.change(input, { target: { value: "Bari" } });
    fireEvent.submit(form);
    second.resolve(
      response({
        items: [item("00000000-0000-4000-8000-000000000002", "Bari")],
        nextCursor: null,
      }),
    );
    await screen.findByText("Bari");
    first.resolve(
      response({
        items: [item("00000000-0000-4000-8000-000000000001", "Ava")],
        nextCursor: null,
      }),
    );
    await Promise.resolve();
    expect(screen.queryByText("Ava")).not.toBeInTheDocument();
  });
  it("blocks duplicate pagination and deduplicates patients", async () => {
    const pending = deferred(),
      fetch = vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    render(
      <PatientDirectoryPageView
        page={{
          items: [item("00000000-0000-4000-8000-000000000001", "Ava")],
          nextCursor: "next",
        }}
        query="Ava"
        locale="en"
        m={m}
      />,
    );
    const load = screen.getByRole("button", { name: m.next });
    fireEvent.click(load);
    fireEvent.click(load);
    expect(fetch).toHaveBeenCalledTimes(1);
    pending.resolve(
      response({
        items: [
          item("00000000-0000-4000-8000-000000000001", "Ava"),
          item("00000000-0000-4000-8000-000000000002", "Bari"),
        ],
        nextCursor: null,
      }),
    );
    await screen.findByText("Bari");
    expect(screen.getAllByText("Ava")).toHaveLength(1);
  });
  it("keeps current results and announces pagination failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(
      <PatientDirectoryPageView
        page={{
          items: [item("00000000-0000-4000-8000-000000000001", "Ava")],
          nextCursor: "next",
        }}
        query="Ava"
        locale="en"
        m={m}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: m.next }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(m.offline),
    );
    expect(screen.getByText("Ava")).toBeInTheDocument();
  });
});
