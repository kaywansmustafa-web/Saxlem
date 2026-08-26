import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";
const root = resolve(process.cwd(), "src");
function files(path = root): string[] {
  return readdirSync(path).flatMap((name) => {
    const value = resolve(path, name);
    return statSync(value).isDirectory() ? files(value) : [value];
  });
}
const source = () =>
  files()
    .filter((path) => /\.(ts|tsx)$/u.test(path))
    .map((path) => [relative(root, path), readFileSync(path, "utf8")] as const);
describe("owner architecture", () => {
  it("keeps tokens and raw environment access server-only", () => {
    for (const [path, text] of source()) {
      if (/accessToken|refreshToken|sessionSecret|process\.env/u.test(text))
        expect(text, path).toMatch(/^import "server-only";/u);
      if (text.includes('"use client"'))
        expect(text, path).not.toMatch(
          /accessToken|refreshToken|process\.env|@\/infrastructure\/(?:auth|session-cookie|config|api-client)/u,
        );
    }
  });
  it("contains no clinic-portal runtime imports, mocks, secrets, or mojibake", () => {
    for (const [path, text] of source())
      expect(text, path).not.toMatch(
        /clinic-portal|Mock[A-Z]|mock-data|localStorage|sessionStorage|â|Ã|�/u,
      );
  });
  it("protects every owner workspace and has no patient, clinic manager, doctor, or receptionist authorization branch", () => {
    const layout = readFileSync(
        resolve(root, "app/(protected)/layout.tsx"),
        "utf8",
      ),
      claims = readFileSync(resolve(root, "domain/session.ts"), "utf8");
    expect(layout).toContain("requireOwnerSession");
    expect(claims).toContain('z.literal("platformAdministrator")');
    expect(claims).not.toMatch(
      /z\.enum\(\[[^\]]*(?:clinicManager|receptionist|doctor|patient)/u,
    );
  });
});
