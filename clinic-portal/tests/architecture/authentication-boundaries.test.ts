import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.(?:ts|tsx)$/u.test(entry.name) ? [absolute] : [];
  });
}
const relative = (path: string): string =>
  path.slice(root.length + 1).replaceAll("\\", "/");

describe("authentication architecture boundaries", () => {
  it("marks every token-bearing source module as server-only", () => {
    const tokenTerms = /accessToken|refreshToken|sealedSession|sessionSecret|EncryptJWT|jwtDecrypt/u;
    for (const file of sourceFiles(root)) {
      const source = read(relative(file));
      if (!tokenTerms.test(source)) continue;
      expect(relative(file)).not.toContain("public-auth-models");
      expect(source, relative(file)).toMatch(/import\s+["']server-only["']/u);
    }
  });

  it("keeps token and session-cookie modules out of client components", () => {
    for (const file of sourceFiles(root)) {
      const source = read(relative(file));
      if (!source.includes('"use client"') && !source.includes('"use client";')) {
        continue;
      }
      expect(source).not.toMatch(/session-cookie|auth-models|accessToken|refreshToken/);
    }
  });

  it("prevents portal pages from reading raw environment variables", () => {
    for (const file of sourceFiles(resolve(root, "app"))) {
      if (!/(?:page|layout|loading|error|not-found)\.tsx$/u.test(file)) continue;
      expect(read(relative(file))).not.toContain("process.env");
    }
  });

  it("keeps tokens out of client component prop contracts", () => {
    const clientSources = sourceFiles(root)
      .map((file) => read(relative(file)))
      .filter(
        (source) =>
          source.includes('"use client"') || source.includes('"use client";'),
      )
      .join("\n");
    expect(clientSources).not.toMatch(/accessToken|refreshToken|sealedSession/);
  });

  it("keeps production authentication composition free of mock sessions", () => {
    const composition = read("infrastructure/auth/composition.ts");
    expect(composition).not.toMatch(/Mock|getSession|getDoctorSession/);
    expect(composition).not.toContain("infrastructure/composition");
  });

  it("keeps public role and navigation models token-free", () => {
    const publicModels = read("features/authentication/domain/public-auth-models.ts");
    expect(publicModels).not.toMatch(/accessToken|refreshToken|secret|cookie|sealed/u);
  });

  it("isolates all legacy mocks behind the exact development composition", () => {
    const production = read("infrastructure/composition/production.ts");
    const development = read("infrastructure/composition/development.ts");
    const nextConfig = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    expect(production).not.toMatch(/Mock|mock-|composition\/development|import\(/u);
    expect(production).toMatch(/dashboardService = \(\): DashboardServices => null/u);
    expect(development).toMatch(/MockDashboardRepository|MockDoctorSessionRepository/u);
    expect(nextConfig).toContain('process.env.SAXLEM_PORTAL_ENV === "development"');
    expect(nextConfig).toContain("composition/production.ts");
  });

  it("routes every page and legacy route adapter through the build-time composition alias", () => {
    for (const file of sourceFiles(resolve(root, "app"))) {
      const source = read(relative(file));
      expect(source, relative(file)).not.toMatch(/infrastructure\/composition(?:\/development)?["']/u);
      expect(source, relative(file)).not.toMatch(/features\/[^"']+\/data\/mock/u);
      expect(source, relative(file)).not.toMatch(/import\([^)]*(?:mock|composition\/development)/u);
    }
    const consumers = sourceFiles(resolve(root, "app"))
      .map((file) => read(relative(file)))
      .filter((source) => source.includes("portal-composition"));
    expect(consumers.length).toBeGreaterThan(0);
    expect(consumers.every((source) => source.includes("@portal-composition"))).toBe(true);
  });
});
