import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { AppointmentsPage } from "@/features/appointments/presentation/appointments-page";
import { PatientDirectoryPageView } from "@/features/patients/presentation/patient-directory-page";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
afterEach(cleanup);
describe("clinical UI", () => {
  it.each(["en", "ar", "ku"] as const)(
    "localizes patient lookup for %s",
    (locale) => {
      render(
        <PatientDirectoryPageView
          page={null}
          query=""
          locale={locale}
          m={clinicalMessages(locale)}
        />,
      );
      expect(screen.getByRole("search")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        clinicalMessages(locale).patients,
      );
    },
  );
  it("renders filters and an accessible empty state", async () => {
    const { container } = render(
      <AppointmentsPage
        page={{ items: [], nextCursor: null }}
        locale="en"
        m={clinicalMessages("en")}
        filters={{ from: "2026-08-02", to: "2026-08-02", trail: [] }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Apply filters" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No appointments");
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
