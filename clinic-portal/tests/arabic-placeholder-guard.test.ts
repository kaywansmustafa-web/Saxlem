import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(dir, entry.name))
      : /\.(ts|tsx)$/u.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  );

describe("Arabic copy", () => {
  it("never ships the bare placeholder word in place of a translation", () => {
    const offenders = walk(root).filter((file) =>
      /[A-Za-z0-9_]+\s*:\s*"معلومات"/u.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
