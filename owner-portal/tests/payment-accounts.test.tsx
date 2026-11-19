import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const request = vi.fn();
const restoreOwnerSession = vi.fn();
vi.mock("@/infrastructure/auth", () => ({
  ownerApi: () => ({ request }),
  restoreOwnerSession: () => restoreOwnerSession(),
}));
vi.mock("@/infrastructure/request-security", async () => {
  const actual = await vi.importActual<
    typeof import("@/infrastructure/request-security")
  >("@/infrastructure/request-security");
  return {
    ...actual,
    sameOrigin: (r: Request) =>
      r.headers.get("origin") === "https://owner.example",
  };
});
import { PUT } from "@/app/api/platform/payment-accounts/[organizationId]/route";
import { PaymentAccountForm } from "@/components/payment-account-form";

const organizationId = "0198d38e-5862-7000-8000-000000000001";
const valid = {
  provider: "fib",
  environment: "stage",
  clientId: "clinic-client",
  clientSecret: "secret-value-123",
  onlineEnabled: true,
};
const put = (body: unknown, origin = "https://owner.example") =>
  PUT(
    new Request(
      `https://owner.example/api/platform/payment-accounts/${organizationId}`,
      {
        method: "PUT",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
    { params: Promise.resolve({ organizationId }) },
  );

describe("organization payment accounts", () => {
  afterEach(() => {
    cleanup();
    request.mockReset();
    restoreOwnerSession.mockReset();
  });

  it("forwards valid credentials to the backend with PUT", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ organizationId, connected: true });
    const response = await put(valid);
    expect(response.status).toBe(200);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        path: `/api/v1/platform/organizations/${organizationId}/payment-account`,
        body: valid,
      }),
    );
    expect(JSON.stringify(await response.json())).not.toContain(
      "secret-value-123",
    );
  });

  it("rejects other origins, bad input and missing sessions", async () => {
    expect((await put(valid, "https://evil.example")).status).toBe(403);
    expect((await put({ ...valid, clientSecret: "short" })).status).toBe(400);
    expect((await put({ ...valid, extra: true })).status).toBe(400);
    restoreOwnerSession.mockResolvedValue(null);
    expect((await put(valid)).status).toBe(401);
    expect(request).not.toHaveBeenCalled();
  });

  it("opens a form that never pre-fills the secret", async () => {
    render(
      <PaymentAccountForm
        account={{
          organizationId,
          connected: true,
          provider: "fib",
          environment: "prod",
          onlineEnabled: true,
        }}
        allowSimulated={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(screen.getByLabelText("Client secret")).toHaveValue("");
    expect(screen.getByLabelText("FIB environment")).toHaveValue("prod");
    expect(screen.queryByLabelText("Provider")).not.toBeInTheDocument();
  });
});
