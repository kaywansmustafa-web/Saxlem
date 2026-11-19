import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
import { GlobalSearch } from "@/components/global-search";
import { DataTable } from "@/components/data-table";
import { ActivationForm } from "@/components/activation-form";
import { StaffControls } from "@/components/staff-controls";

describe("platform control presentation", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    push.mockReset();
    refresh.mockReset();
  });
  it("supports bounded debounced search and keyboard selection", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              category: "clinic",
              id: "0198d38e-5862-7000-8000-000000000001",
              label: "Saxlem Clinic",
              description: "DUH-01",
              href: "/clinics/0198d38e-5862-7000-8000-000000000001",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(<GlobalSearch />);
    const input = screen.getByRole("combobox", { name: "Global search" });
    await userEvent.type(input, "Saxlem");
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /Saxlem Clinic/ }),
      ).toBeInTheDocument(),
    );
    await userEvent.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith(
      "/clinics/0198d38e-5862-7000-8000-000000000001",
    );
  });
  it("closes search results with Escape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              category: "organization",
              id: "0198d38e-5862-7000-8000-000000000001",
              label: "Saxlem",
              description: "Organization",
              href: "/organizations/0198d38e-5862-7000-8000-000000000001",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(<GlobalSearch />);
    await userEvent.type(screen.getByRole("combobox"), "Saxlem");
    await waitFor(() => expect(screen.getByRole("option")).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
  it("keeps dense operational tables accessible", async () => {
    const { container } = render(
      <DataTable
        headers={["Clinic", "Status"]}
        rows={[["Duhok", "Healthy"]]}
      />,
    );
    expect((await axe(container)).violations).toEqual([]);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  it("activates an account without placing the credential in a URL", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    render(<ActivationForm />);
    await userEvent.type(
      screen.getByLabelText("One-time activation credential"),
      "opaque-activation-credential-that-is-long-enough",
    );
    await userEvent.type(
      screen.getByLabelText("Create password"),
      "A secure passphrase 2026!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Activate account" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/account is active/i)).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/activation");
    expect(String(fetch.mock.calls[0]?.[0])).not.toContain("opaque-activation");
  });
  it("submits staff status changes through the protected BFF", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    render(
      <StaffControls
        staffId="0198d38e-5862-7000-8000-000000000001"
        status="active"
        memberships={[]}
        organizations={[]}
        clinics={[]}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Deactivate account" }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/platform/staff/0198d38e-5862-7000-8000-000000000001",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
