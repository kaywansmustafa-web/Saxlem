import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("foundation localization encoding", () => {
  it("contains no common UTF-8 corruption markers", () => {
    for (const file of ["foundation-messages.ts", "portal-shell.tsx", "state-view.tsx", "honest-placeholder.tsx"]) {
      const source = readFileSync(resolve(process.cwd(), "src/features/portal-foundation/presentation", file), "utf8");
      expect(source, file).not.toMatch(/\u00e2|\u00c3|\u00d8|\u00d9|\ufffd/u);
    }
  });
});
