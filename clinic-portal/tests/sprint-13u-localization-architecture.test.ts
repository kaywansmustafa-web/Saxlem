import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n";

const sourceRoot = path.resolve(process.cwd(), "src");

function productionSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionSources(target);
    return /(?:messages|i18n).*\.ts$/.test(entry.name) ? [target] : [];
  });
}

describe("Sprint 13U localization boundaries", () => {
  it("does not inherit English in supported locale dictionaries", () => {
    for (const file of productionSources(sourceRoot)) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\.\.\.(?:en|\w+En)\b/);
    }
  });

  it("keeps supported foundation catalogs complete and RTL", () => {
    const english = messages("en");
    for (const locale of ["ar", "ku"] as const) {
      const localized = messages(locale);
      expect(Object.keys(localized)).toEqual(Object.keys(english));
      for (const key of Object.keys(english) as (keyof typeof english)[]) {
        expect(localized[key], `${locale}.${key}`).not.toBe(english[key]);
      }
    }
  });

  it("contains approved core terminology", () => {
    expect(messages("ar").doctor).toBe("الطبيب");
    expect(messages("ar").appointments).toBe("المواعيد");
    expect(messages("ar").queue).toBe("قائمة الانتظار المباشرة");
    expect(messages("ku").doctor).toBe("نوژدار");
    expect(messages("ku").appointments).toBe("ژڤان");
    expect(messages("ku").queue).toBe("رێزبەندییا زندی");
  });

  it("keeps production localization sources valid UTF-8", () => {
    const corruption = /(?:Ã|â|ΓÇ|├|┬|�|\?{4,})/u;
    for (const file of productionSources(sourceRoot)) {
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(corruption);
    }
  });

  it("keeps static Badini UI values in Arabic script", () => {
    for (const file of productionSources(sourceRoot)) {
      const source = fs.readFileSync(file, "utf8");
      const dictionaries = source.matchAll(
        /const\s+\w*(?:ku|Ku)[^=]*=\{([\s\S]*?)\};/gu,
      );
      for (const dictionary of dictionaries) {
        const values = dictionary[1].matchAll(/\b\w+:"((?:\\.|[^"\\])*)"/gu);
        for (const value of values) {
          const withoutPlaceholders = value[1].replace(/\{[^}]*\}/gu, "");
          expect(withoutPlaceholders, `${file}: ${value[1]}`).not.toMatch(
            /[A-Za-z]/u,
          );
        }
      }
    }
  });
});
