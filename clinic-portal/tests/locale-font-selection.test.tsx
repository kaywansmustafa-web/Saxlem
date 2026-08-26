import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import LocaleLayout from "@/app/[locale]/layout";

const renderLayout = async (locale: string) =>
  LocaleLayout({ children: "content", params: Promise.resolve({ locale }) });

describe("locale typography", () => {
  it("keeps English on the existing default font and selects Arabic and Badini by locale", async () => {
    const english = await renderLayout("en");
    const arabic = await renderLayout("ar");
    const badini = await renderLayout("ku");

    expect(english.props).toMatchObject({ className: "locale-root locale-en", lang: "en", dir: "ltr" });
    expect(arabic.props).toMatchObject({ className: "locale-root locale-ar", lang: "ar", dir: "rtl" });
    expect(badini.props).toMatchObject({ className: "locale-root locale-ku", lang: "ku", dir: "rtl" });
  });

  it("self-hosts Cairo and Rudaw and maps them without using RTL as the selector", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain('font-family:"Cairo"');
    expect(css).toContain('font-family:"Rudaw"');
    expect(css).toContain('.locale-root[lang="ar"]{font-family:"Cairo"');
    expect(css).toContain('.locale-root[lang="ku"]{font-family:"Rudaw"');
    expect(css).not.toMatch(/\[dir=["']?rtl["']?\][^{]*font-family/u);
  });
});
