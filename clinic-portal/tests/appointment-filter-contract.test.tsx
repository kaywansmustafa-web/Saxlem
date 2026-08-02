import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  iraqCalendarDate,
  iraqDateRange,
  iraqLocalDateTimeToOffset,
  opaqueAppointmentCursorSchema,
  parseAppointmentNavigation,
} from "@/features/appointments/domain/appointment-filter-contract";
import { AppointmentsPage } from "@/features/appointments/presentation/appointments-page";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
describe("appointment filter contract", () => {
  it("accepts signed and UUID opaque cursors", () => {
    expect(
      opaqueAppointmentCursorSchema.parse("eyJpZCI6IjEifQ.signature_-~"),
    ).toContain("signature");
    expect(
      opaqueAppointmentCursorSchema.parse(
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toContain("0000");
  });
  it("rejects empty, unsafe, and oversized cursors", () => {
    for (const value of ["", "has space", "line\nbreak", "x".repeat(1025)])
      expect(opaqueAppointmentCursorSchema.safeParse(value).success).toBe(
        false,
      );
  });
  it("round trips opaque cursor history for Next and Previous", () => {
    const m = clinicalMessages("en"),
      first = render(
        <AppointmentsPage
          page={{ items: [], nextCursor: "signed.cursor/one==" }}
          locale="en"
          m={m}
          filters={{ from: "2026-08-02", to: "2026-08-02", trail: [] }}
        />,
      ),
      next = screen.getByRole("link", { name: m.next }),
      nextUrl = new URL(next.getAttribute("href")!, "https://portal.test");
    expect(nextUrl.searchParams.get("cursor")).toBe("signed.cursor/one==");
    first.unmount();
    render(
      <AppointmentsPage
        page={{ items: [], nextCursor: "signed.cursor/two==" }}
        locale="en"
        m={m}
        filters={{
          from: "2026-08-02",
          to: "2026-08-02",
          cursor: "signed.cursor/one==",
          trail: [],
        }}
      />,
    );
    const thirdUrl = new URL(
        screen.getByRole("link", { name: m.next }).getAttribute("href")!,
        "https://portal.test",
      ),
      third = parseAppointmentNavigation(
        thirdUrl.searchParams.get("cursor")!,
        thirdUrl.searchParams.get("trail")!,
      );
    expect(third).toEqual({
      ok: true,
      cursor: "signed.cursor/two==",
      trail: ["signed.cursor/one=="],
    });
    const previous = new URL(
      screen.getByRole("link", { name: m.previous }).getAttribute("href")!,
      "https://portal.test",
    );
    expect(previous.searchParams.get("cursor")).toBeNull();
  });
  it("bounds and preserves multiple traversal history", () => {
    const trail = JSON.stringify(
      Array.from({ length: 10 }, (_, i) => `cursor.${i}`),
    );
    expect(parseAppointmentNavigation("cursor.next", trail)).toEqual({
      ok: true,
      cursor: "cursor.next",
      trail: Array.from({ length: 10 }, (_, i) => `cursor.${i}`),
    });
    expect(
      parseAppointmentNavigation(
        "cursor.next",
        JSON.stringify(Array(11).fill("cursor")),
      ).ok,
    ).toBe(false);
  });
  it("derives Iraq dates across UTC midnight", () => {
    expect(iraqCalendarDate(new Date("2026-08-01T22:30:00Z"))).toBe(
      "2026-08-02",
    );
    expect(iraqCalendarDate(new Date("2026-08-01T20:59:59Z"))).toBe(
      "2026-08-01",
    );
  });
  it("validates leap years, month lengths, order, and exact boundaries", () => {
    expect(iraqDateRange("2024-02-29", "2024-03-01")).toMatchObject({
      ok: true,
      fromInstant: "2024-02-29T00:00:00.000+03:00",
      toInstant: "2024-03-01T23:59:59.999+03:00",
    });
    for (const date of ["2023-02-29", "2026-04-31", "2026-13-01"])
      expect(iraqDateRange(date, date).ok).toBe(false);
    expect(iraqDateRange("2026-08-03", "2026-08-02").ok).toBe(false);
  });
  it("converts datetime-local deterministically without DST", () => {
    expect(iraqLocalDateTimeToOffset("2026-01-15T10:30")).toBe(
      "2026-01-15T10:30:00+03:00",
    );
    expect(iraqLocalDateTimeToOffset("2026-07-15T10:30")).toBe(
      "2026-07-15T10:30:00+03:00",
    );
    for (const value of ["2026-02-30T10:00", "2026-01-01T25:00", "bad"])
      expect(iraqLocalDateTimeToOffset(value)).toBeNull();
  });
});
