import { describe, expect, it } from "vitest";
import {
  clinicPageSchema,
  clinicSchema,
  organizationPageSchema,
  organizationSchema,
} from "@/features/administration/domain/models";

const organization = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Saxlem",
  status: "active",
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-10T10:00:00.000Z",
};
const clinic = {
  id: "00000000-0000-4000-8000-000000000002",
  organizationId: organization.id,
  name: "Duhok",
  code: "DHK_1",
  timezone: "Asia/Baghdad",
  status: "active",
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
};

describe("administration backend schemas", () => {
  it("accepts exact organization and clinic contracts", () => {
    expect(organizationSchema.parse(organization)).toEqual(organization);
    expect(clinicSchema.parse(clinic)).toEqual(clinic);
    expect(
      organizationPageSchema.parse({ items: [organization], nextCursor: null })
        .items,
    ).toHaveLength(1);
    expect(
      clinicPageSchema.parse({ items: [clinic], nextCursor: "opaque.cursor" })
        .nextCursor,
    ).toBe("opaque.cursor");
  });
  it.each([
    { ...organization, id: "bad" },
    { ...organization, status: "pending" },
    { ...organization, createdAt: "not-time" },
    { ...organization, extra: true },
  ])("rejects malformed organizations", (value) =>
    expect(organizationSchema.safeParse(value).success).toBe(false),
  );
  it.each([
    { ...clinic, organizationId: "bad" },
    { ...clinic, code: "bad code" },
    { ...clinic, timezone: "invalid" },
    { ...clinic, updatedAt: "bad" },
    { ...clinic, private: true },
  ])("rejects malformed clinics", (value) =>
    expect(clinicSchema.safeParse(value).success).toBe(false),
  );
  it("rejects malformed cursors and duplicate identifiers", () => {
    expect(
      organizationPageSchema.safeParse({ items: [], nextCursor: "bad cursor" })
        .success,
    ).toBe(false);
    expect(
      organizationPageSchema.safeParse({
        items: [organization, organization],
        nextCursor: null,
      }).success,
    ).toBe(false);
  });
});
