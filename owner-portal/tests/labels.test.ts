import { describe, expect, it } from "vitest";
import { humanize, statusTone } from "@/domain/labels";

describe("owner labels", () => {
  it("turns backend codes into readable words", () => {
    expect(humanize("platformAdministrator")).toBe("Platform administrator");
    expect(humanize("appointment.page_viewed")).toBe("Appointment page viewed");
    expect(humanize("initial")).toBe("First visit");
    expect(humanize("badiniKurdish")).toBe("Kurdish (Badini)");
    expect(humanize(undefined)).toBe("—");
  });
  it("maps statuses to a tone", () => {
    expect(statusTone("succeeded")).toBe("success");
    expect(statusTone("cancelled")).toBe("danger");
    expect(statusTone("scheduled")).toBe("info");
    expect(statusTone("draft")).toBe("warning");
  });
});
