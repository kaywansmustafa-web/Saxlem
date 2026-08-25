import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { billingMessages } from "@/features/billing/presentation/messages";
import { formatIqd } from "@/features/billing/presentation/money";

const organizationId = "11111111-1111-4111-8111-111111111111";
const statement = {
  id: "22222222-2222-4222-8222-222222222222",
  organizationId,
  periodStart: "2026-08-01T00:00:00+03:00",
  periodEnd: "2026-09-01T00:00:00+03:00",
  timezone: "Asia/Baghdad",
  status: "draft",
  grossEarnedIqd: 2500,
  reversalsIqd: 0,
  netCommissionIqd: 2500,
  qualifyingCount: 2,
  reversalCount: 0,
  version: 1,
  finalizedAt: null,
  lines: [],
  clinicBreakdowns: [],
} as const;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("billing presentation", () => {
  it("formats only exact integer IQD amounts", () => {
    expect(formatIqd(25000, "en")).toBe("25,000 IQD");
    expect(() => formatIqd(1.25, "en")).toThrow("Invalid IQD amount");
  });

  it("keeps complete message-key parity", () => {
    const keys = Object.keys(billingMessages("en")).sort();
    expect(Object.keys(billingMessages("ar")).sort()).toEqual(keys);
    expect(Object.keys(billingMessages("ku")).sort()).toEqual(keys);
  });

  it("shows authoritative read-only manager billing without mutation or payment actions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, statement }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const { container } = render(
      <BillingWorkspace
        locale="en"
        role="clinicManager"
        organizationId={organizationId}
        mode="overview"
      />,
    );
    expect((await screen.findAllByText("2,500 IQD")).length).toBe(2);
    expect(screen.getByText("Read-only billing")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalize/iu })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /pay|checkout|settle/iu }),
    ).toBeNull();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("requires an explicit authoritative organization for platform billing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              items: [{ id: organizationId, name: "Saxlem Clinic" }],
              nextCursor: null,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    render(
      <BillingWorkspace
        locale="en"
        role="platformAdministrator"
        mode="overview"
      />,
    );
    expect(
      await screen.findByRole("option", { name: "Saxlem Clinic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/select an authoritative organization/iu),
    ).toBeInTheDocument();
  });

  it("keeps loaded commissions visible when load more fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              items: [
                {
                  id: "33333333-3333-4333-8333-333333333333",
                  organizationId,
                  clinicId: "44444444-4444-4444-8444-444444444444",
                  appointmentId: "55555555-5555-4555-8555-555555555555",
                  appointmentReference: "APT-42",
                  planCode: "PLAN",
                  amountIqd: 1250,
                  currency: "IQD",
                  ruleCode: "FIXED",
                  ruleVersion: 1,
                  planVersion: 1,
                  completedAt: "2026-08-10T09:00:00+03:00",
                  recognizedAt: "2026-08-10T09:00:00+03:00",
                  status: "earned",
                  originalCommissionId: null,
                },
              ],
              nextCursor: "opaque.cursor",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <BillingWorkspace
        locale="en"
        role="clinicManager"
        organizationId={organizationId}
        mode="commissions"
      />,
    );
    expect(await screen.findByText("APT-42")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("APT-42")).toBeInTheDocument();
  });
});
