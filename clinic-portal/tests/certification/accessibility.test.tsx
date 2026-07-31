import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/authentication/presentation/login-form";
import { routePolicies, navigationFor, type PortalRouteId } from "@/features/portal-foundation/domain/route-policy";
import { foundationMessages } from "@/features/portal-foundation/presentation/foundation-messages";
import { HonestPlaceholder } from "@/features/portal-foundation/presentation/honest-placeholder";
import { PortalShell } from "@/features/portal-foundation/presentation/portal-shell";
import { PortalStateView, type StateKind } from "@/features/portal-foundation/presentation/state-view";
import type { PortalStaffRole } from "@/features/authentication/domain/portal-access-types";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Sprint 13K-C accessibility certification", () => {
  it("supports keyboard-only login and associated validation", async () => {
    const user = userEvent.setup();
    const { container } = render(<main><h1>Staff sign in</h1><LoginForm locale="en" m={foundationMessages("en")} returnPath="/en/dashboard" /></main>);
    await user.tab();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Password")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Show password" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    await user.tab();
    await user.keyboard("{Enter}");
    const alert = await screen.findByRole("alert");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", alert.id);
    expect((await axe(container)).violations).toEqual([]);
  });

  for (const [role, current] of [
    ["receptionist", "dashboard"], ["doctor", "doctorWorkspace"],
    ["clinicManager", "dashboard"], ["platformAdministrator", "administration"],
  ] as const satisfies readonly (readonly [PortalStaffRole, PortalRouteId])[]) {
    it(`has an accessible ${role} shell`, async () => {
      vi.stubGlobal("fetch", vi.fn());
      const { container } = render(<PortalShell locale="ar" m={foundationMessages("ar")} role={role} current={current} navigation={navigationFor(role)} context={{}}><h1>Page</h1></PortalShell>);
      expect(screen.getByRole("link", { current: "page" })).toBeInTheDocument();
      expect((await axe(container)).violations).toEqual([]);
    });
  }

  it.each(["loading", "unauthorized", "forbidden", "sessionExpired", "offline", "timeout", "failure", "notFound"] satisfies StateKind[])(
    "has an accessible %s state view",
    async (kind) => {
      const { container } = render(<PortalStateView kind={kind} m={foundationMessages("en")} actionHref="/en/login" />);
      expect((await axe(container)).violations).toEqual([]);
    },
  );

  it("has an accessible honest placeholder", async () => {
    const { container } = render(<HonestPlaceholder route={routePolicies[0]} m={foundationMessages("ku")} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
