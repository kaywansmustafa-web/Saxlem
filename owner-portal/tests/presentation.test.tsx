import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/organizations" }));
import { OwnerNavigation } from "@/components/owner-navigation";
import { StateView } from "@/components/app-shell";
const items = [
  ["Dashboard", "/dashboard"],
  ["Organizations", "/organizations"],
] as const;
describe("owner presentation", () => {
  it("marks the active destination and remains accessible", async () => {
    const { container } = render(
      <>
        <OwnerNavigation items={items} />
        <StateView
          title="Foundation ready"
          description="No fake data is shown."
        />
      </>,
    );
    expect(screen.getByRole("link", { name: "Organizations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
