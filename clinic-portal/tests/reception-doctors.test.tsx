import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("server-only", () => ({}));
const update = vi.fn();
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({ reception: { update } })),
}));
import {
  ChooseDoctors,
  MyDoctorsBar,
} from "@/features/reception/presentation/my-doctors";
import { receptionMessages } from "@/features/reception/presentation/messages";
import { ownDoctorIds } from "@/features/reception/presentation/reception-setup";
import { PUT } from "@/app/api/reception/doctors/route";

const a = "00000000-0000-4000-8000-00000000000a";
const b = "00000000-0000-4000-8000-00000000000b";
const m = receptionMessages("en");

beforeEach(() => {
  refresh.mockReset();
  update.mockReset().mockResolvedValue({ doctors: [], configured: true });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ok: true }))),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("receptionist doctors", () => {
  it("pre-selects the only doctor on first sign-in and saves it", async () => {
    render(
      <ChooseDoctors
        doctors={[{ id: a, displayName: "Dr. Shilan", assigned: false }]}
        m={m}
      />,
    );
    expect(
      (screen.getByRole("checkbox", { name: /Shilan/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: m.save }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(
      JSON.parse(String(vi.mocked(fetch).mock.calls[0]![1]!.body)),
    ).toEqual({
      doctorIds: [a],
    });
  });

  it("requires at least one doctor", () => {
    render(
      <ChooseDoctors
        doctors={[
          { id: a, displayName: "Dr. Shilan", assigned: false },
          { id: b, displayName: "Dr. Karwan", assigned: false },
        ]}
        m={m}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: m.save }));
    expect(screen.getByRole("alert").textContent).toBe(m.atLeastOne);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("adds a second doctor from the bar", async () => {
    render(
      <MyDoctorsBar
        doctors={[
          { id: a, displayName: "Dr. Shilan", assigned: true },
          { id: b, displayName: "Dr. Karwan", assigned: false },
        ]}
        m={m}
      />,
    );
    expect(screen.getByRole("listitem").textContent).toBe("Dr. Shilan");
    fireEvent.click(screen.getByRole("button", { name: m.change }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Karwan/ }));
    fireEvent.click(screen.getByRole("button", { name: m.save }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(
      JSON.parse(String(vi.mocked(fetch).mock.calls[0]![1]!.body)).doctorIds,
    ).toEqual([a, b]);
  });

  it("filters only once a receptionist has chosen", () => {
    expect(ownDoctorIds(null)).toBeNull();
    expect(
      ownDoctorIds({
        configured: false,
        doctors: [{ id: a, displayName: "A", assigned: false }],
      }),
    ).toBeNull();
    expect([
      ...ownDoctorIds({
        configured: true,
        doctors: [
          { id: a, displayName: "A", assigned: true },
          { id: b, displayName: "B", assigned: false },
        ],
      })!,
    ]).toEqual([a]);
  });

  it("saves through the same-origin BFF only", async () => {
    const request = (origin: string, body: unknown) =>
      new Request("https://portal.example/api/reception/doctors", {
        method: "PUT",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    expect(
      (await PUT(request("https://portal.example", { doctorIds: [a] }))).status,
    ).toBe(200);
    expect(update).toHaveBeenCalledWith([a]);
    expect(
      (await PUT(request("https://portal.example", { doctorIds: [] }))).status,
    ).toBe(400);
    expect(
      (await PUT(request("https://evil.example", { doctorIds: [a] }))).status,
    ).toBe(403);
  });
});
