import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatementsOverview } from "@/features/billing/presentation/statements-overview";
import type { Collection } from "@/features/billing/domain/models";

afterEach(cleanup);
const owed = (stage: Collection["stage"]): Collection => ({
  organizationId: "01a1e0f5-05a9-71b1-9fb6-ef1f51170005",
  organizationName: "Hillview",
  doctorId: "01a1e690-ab6a-7685-9945-0d27fe79c55d",
  doctorName: "Dr. Karwan",
  stage,
  owedIqd: 3750,
  cycleNumber: 2,
  statementNumber: "SX-79C55D-002",
  dueAt: "2026-11-28T21:00:00.000Z",
  warnOn: "2027-01-12T21:00:00.000Z",
  hideOn: "2027-01-27T21:00:00.000Z",
  hiddenAt: stage === "hidden" ? "2027-01-28T09:00:00.000Z" : null,
  graceUntil: null,
});
const show = (stage: Collection["stage"], locale: "en" | "ku" = "en") =>
  render(
    <StatementsOverview
      statements={[]}
      collections={[owed(stage)]}
      locale={locale}
      basePath={() => "/"}
      showCommissionsLink
    />,
  );

describe("billing payment reminders", () => {
  it("starts gently with the amount and the due date", () => {
    show("due");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Dr. Karwan owes Saxlem 3,750 IQD on statement SX-79C55D-002. Please pay in cash by 29 Nov 2026",
    );
  });
  it("explains deduction, then the hiding date, then how to come back", () => {
    show("overdue");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "taken from Dr. Karwan's next app payments",
    );
    cleanup();
    show("warning");
    expect(screen.getByRole("alert")).toHaveTextContent("before 28 Jan 2027");
    cleanup();
    show("hidden");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Phone and walk-in bookings still work",
    );
  });
  it("shows nothing when nothing is owed, and speaks Badini", () => {
    show("clear");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    cleanup();
    show("hidden", "ku");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "ژ ئەپێ ساخلەم هاتیە ڤەشارتن",
    );
  });
});
