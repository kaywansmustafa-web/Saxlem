import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(?:ts|tsx|js|jsx)$/u.test(entry.name) ? [path] : [];
  });
}

const applicationFiles = files(root);
const source = (file: string): string => readFileSync(file, "utf8");
const label = (file: string): string => relative(process.cwd(), file).replaceAll("\\", "/");

describe("temporary dependency reachability controls", () => {
  it("has no Next image import, optimizer route, or application image-processing workflow", () => {
    for (const file of applicationFiles) {
      expect(source(file), label(file)).not.toMatch(/(?:from|import\s*\()\s*["']next\/image["']/u);
      expect(source(file), label(file)).not.toMatch(/\/_next\/image|imageOptimizer|image-processing|processUserImage/iu);
    }
    expect(applicationFiles.map(label).filter((file) => /(?:^|\/)api\/.*image/iu.test(file))).toEqual([]);
  });

  it("does not import PostCSS or Sharp from application code", () => {
    for (const file of applicationFiles) {
      expect(source(file), label(file)).not.toMatch(/(?:from|import\s*\()\s*["'](?:postcss|sharp)(?:\/[^"']*)?["']/u);
      expect(source(file), label(file)).not.toMatch(/require\(\s*["'](?:postcss|sharp)(?:\/[^"']*)?["']\s*\)/u);
    }
  });

  it("accepts no untrusted CSS, source map, glob, or filesystem-path API field", () => {
    const routes = applicationFiles.filter((file) => /(?:^|\\)app\\api\\.*route\.ts$/u.test(file));
    expect(routes.length).toBeGreaterThan(0);
    const prohibitedInputField = /\b(?:css|stylesheet|sourceMap|sourceMappingURL|glob|globPattern|filePath|filesystemPath|directoryPath)\s*:/u;
    for (const file of routes) {
      expect(source(file), label(file)).not.toMatch(prohibitedInputField);
    }
  });

  it("keeps lint and glob tooling outside production application imports", () => {
    const prohibitedRuntimeImport = /(?:from|import\s*\(|require\()\s*["'](?:eslint|eslint-config-next|minimatch|brace-expansion)(?:\/[^"']*)?["']/u;
    for (const file of applicationFiles) {
      expect(source(file), label(file)).not.toMatch(prohibitedRuntimeImport);
    }

    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.dependencies).not.toHaveProperty("eslint");
    expect(manifest.dependencies).not.toHaveProperty("eslint-config-next");
    expect(manifest.dependencies).not.toHaveProperty("minimatch");
    expect(manifest.dependencies).not.toHaveProperty("brace-expansion");
    expect(manifest.devDependencies.eslint).toBeDefined();
    expect(manifest.devDependencies["eslint-config-next"]).toBe("16.2.12");
  });
});
