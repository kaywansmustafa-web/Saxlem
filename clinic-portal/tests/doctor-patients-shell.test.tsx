import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/doctor/patients",
}));

import { Shell } from "@/components/shell";
import { messages } from "@/i18n";

afterEach(cleanup);

describe("doctor patients shell", () => {
  it("marks Patients Today current inside doctor-only navigation", () => {
    render(
      <Shell locale="en" m={messages("en")}>
        <h1>Patients Today content</h1>
      </Shell>,
    );

    expect(
      screen.getByRole("link", { name: "Patients Today" }),
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Live Queue" }),
    ).not.toBeInTheDocument();
  });
});
