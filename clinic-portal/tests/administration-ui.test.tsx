import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdministrationCreateForm,
  AdministrationDetail,
  AdministrationList,
  AdministrationOverview,
} from "@/features/administration/presentation/administration-workspace";
import { administrationMessages } from "@/features/administration/presentation/messages";

const navigation = vi.hoisted(() => ({ push: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

const organization = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Saxlem Health Group",
  status: "active",
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-10T10:00:00.000Z",
} as const;
const clinic = {
  id: "00000000-0000-4000-8000-000000000002",
  organizationId: organization.id,
  name: "Duhok Central Clinic",
  code: "DHK_1",
  timezone: "Asia/Baghdad",
  status: "inactive",
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
} as const;
const m = administrationMessages("en");
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  navigation.push.mockReset();
  navigation.query = "";
});

describe("Sprint 13S administration experience", () => {
  it("renders an honest overview with only approved destinations and no fake counts", () => {
    render(<AdministrationOverview locale="en" m={m} />);
    expect(
      screen.getByRole("heading", { name: m.administration, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: m.openOrganizations }),
    ).toHaveAttribute("href", "/en/administration/organizations");
    expect(screen.getByRole("link", { name: m.openClinics })).toHaveAttribute(
      "href",
      "/en/administration/clinics",
    );
    expect(
      screen.queryByText(/billing|verification|staff|revenue/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+$/u)).not.toBeInTheDocument();
  });

  it("renders organization loading, ready status and authoritative navigation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json({ ok: true, page: { items: [organization], nextCursor: null } }),
    );
    render(<AdministrationList kind="organizations" locale="en" m={m} />);
    expect(screen.getByText(m.loadingOrganizations)).toBeInTheDocument();
    expect(await screen.findByText(organization.name)).toBeInTheDocument();
    expect(screen.getByText(m.active)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: m.viewOrganization }),
    ).toHaveAttribute(
      "href",
      `/en/administration/organizations/${organization.id}`,
    );
  });

  it("keeps loaded records visible when load more fails and suppresses concurrent pagination", async () => {
    let rejectSecond: ((reason: Error) => void) | undefined;
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        json({
          ok: true,
          page: { items: [organization], nextCursor: "opaque-cursor" },
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectSecond = reject;
          }),
      );
    render(<AdministrationList kind="organizations" locale="en" m={m} />);
    await screen.findByText(organization.name);
    const load = screen.getByRole("button", { name: m.loadMore });
    await userEvent.click(load);
    await userEvent.click(load);
    expect(fetch).toHaveBeenCalledTimes(2);
    rejectSecond?.(new Error("offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent(m.unavailable);
    expect(screen.getByText(organization.name)).toBeInTheDocument();
  });

  it("renders organization detail without unsupported controls", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json({ ok: true, organization }),
    );
    render(
      <AdministrationDetail
        kind="organizations"
        locale="en"
        m={m}
        id={organization.id}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: organization.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: m.clinicsInOrganization }),
    ).toHaveAttribute(
      "href",
      `/en/administration/clinics?organizationId=${organization.id}`,
    );
    expect(
      screen.queryByRole("button", { name: /edit|delete|verify/i }),
    ).not.toBeInTheDocument();
  });

  it("fails an invalid detail UUID before network access", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(
      <AdministrationDetail kind="clinics" locale="en" m={m} id="unsafe" />,
    );
    expect(await screen.findByText(m.notFound)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("focuses invalid organization input and prevents duplicate submission", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => new Promise(() => undefined));
    render(<AdministrationCreateForm kind="organization" locale="en" m={m} />);
    await userEvent.click(screen.getByRole("button", { name: m.create }));
    const name = screen.getByLabelText(m.organizationName);
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.type(name, "  Saxlem Group  ");
    await userEvent.click(screen.getByRole("button", { name: m.create }));
    await userEvent.click(screen.getByRole("button", { name: m.creating }));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body)).name).toBe(
      "Saxlem Group",
    );
  });

  it("loads authoritative organizations and normalizes clinic code visibly", async () => {
    navigation.query = `organizationId=${organization.id}`;
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        json({ ok: true, page: { items: [organization], nextCursor: null } }),
      )
      .mockResolvedValueOnce(json({ ok: true, clinic }));
    render(<AdministrationCreateForm kind="clinic" locale="en" m={m} />);
    const select = await screen.findByLabelText(m.selectOrganization);
    expect(select).toHaveValue(organization.id);
    await userEvent.type(screen.getByLabelText(m.clinicName), clinic.name);
    await userEvent.type(screen.getByLabelText(m.clinicCode), "dhk_1");
    expect(screen.getByText("DHK_1")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: m.create }));
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        `/en/administration/clinics/${clinic.id}?created=true`,
      ),
    );
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body)).code).toBe(
      "DHK_1",
    );
  });

  it("fails closed instead of presenting a partial organization selector", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    for (let page = 0; page < 20; page += 1) {
      fetch.mockResolvedValueOnce(
        json({
          ok: true,
          page: {
            items: [
              {
                ...organization,
                id: `00000000-0000-4000-8000-${String(page + 1).padStart(12, "0")}`,
              },
            ],
            nextCursor: `opaque-${page + 1}`,
          },
        }),
      );
    }

    render(<AdministrationCreateForm kind="clinic" locale="en" m={m} />);

    expect(
      await screen.findByText(m.organizationSelectionLimit),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(m.selectOrganization),
    ).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(20);
  });

  it("announces an authoritative creation result on the detail page", async () => {
    navigation.query = "created=true";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json({ ok: true, organization }),
    );

    render(
      <AdministrationDetail
        kind="organizations"
        locale="en"
        m={m}
        id={organization.id}
      />,
    );

    await screen.findByRole("heading", { name: organization.name });
    expect(screen.getByRole("status")).toHaveTextContent(m.organizationCreated);
  });

  it("does not render a stale detail response after the requested record changes", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    const replacement = {
      ...organization,
      id: "00000000-0000-4000-8000-000000000099",
      name: "Replacement Organization",
    };
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(json({ ok: true, organization: replacement }));
    const view = render(
      <AdministrationDetail
        kind="organizations"
        locale="en"
        m={m}
        id={organization.id}
      />,
    );

    view.rerender(
      <AdministrationDetail
        kind="organizations"
        locale="en"
        m={m}
        id={replacement.id}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: replacement.name }),
    ).toBeInTheDocument();
    resolveFirst?.(json({ ok: true, organization }));
    await Promise.resolve();

    expect(screen.queryByText(organization.name)).not.toBeInTheDocument();
    expect(screen.getByText(replacement.name)).toBeInTheDocument();
  });

  it("references field error descriptions only when those errors exist", async () => {
    render(<AdministrationCreateForm kind="organization" locale="en" m={m} />);
    const name = screen.getByLabelText(m.organizationName);
    expect(name).not.toHaveAttribute("aria-describedby");

    await userEvent.click(screen.getByRole("button", { name: m.create }));

    expect(name).toHaveAttribute("aria-describedby", "name-error");
    expect(document.getElementById("name-error")).toBeInTheDocument();
  });

  it("keeps the organization onboarding form free of axe violations", async () => {
    const { container } = render(
      <AdministrationCreateForm kind="organization" locale="en" m={m} />,
    );

    expect((await axe(container)).violations).toEqual([]);
  });

  it("has localized catalog parity, RTL-safe operational values, and no axe violations", async () => {
    expect(Object.keys(administrationMessages("ar"))).toEqual(Object.keys(m));
    expect(Object.keys(administrationMessages("ku"))).toEqual(Object.keys(m));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ ok: true, clinic }));
    const { container } = render(
      <div dir="rtl">
        <AdministrationDetail
          kind="clinics"
          locale="ar"
          m={administrationMessages("ar")}
          id={clinic.id}
        />
      </div>,
    );
    await screen.findByText(clinic.name);
    expect(screen.getByText(clinic.code).closest("bdi")).not.toBeNull();
    expect(screen.getByText(clinic.timezone).closest("bdi")).not.toBeNull();
    expect((await axe(container)).violations).toEqual([]);
  });
});
