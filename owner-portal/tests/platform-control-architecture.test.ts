import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src");
function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("platform control release boundaries", () => {
  it("contains no known mojibake in production source", () => {
    for (const path of files(root)) {
      if (!/\.(?:ts|tsx|css)$/u.test(path)) continue;
      const value = readFileSync(path, "utf8");
      expect(value, relative(root, path)).not.toMatch(/â|Ã|Â|ΓÇ|├|┬|\uFFFD/u);
    }
  });
  it("keeps credentials and document bytes behind same-origin BFF routes", () => {
    const activation = readFileSync(
      join(root, "app/api/activation/route.ts"),
      "utf8",
    );
    const upload = readFileSync(
      join(root, "app/api/documents/upload/route.ts"),
      "utf8",
    );
    expect(activation).toContain("sameOrigin(request)");
    expect(upload).toContain("sameOrigin(request)");
    expect(activation).not.toContain("console.");
    expect(upload).not.toContain("console.");
  });
});
