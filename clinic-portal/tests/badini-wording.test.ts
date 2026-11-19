import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Clinic Portal's Badini follows the same rules as the patient app
// (docs/localization/approved-terminology.md, "Patient app final review").

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

const literal = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
const kurdishLetters = /[کیێڤۆەڕژچگپ]/;
const arabicOnlyLetters = /[ةيكىأإآؤ]/;
const letter = "[\\u0621-\\u064A\\u0671-\\u06D5]";

const badiniStrings = sourceFiles(join(__dirname, "..", "src")).flatMap(
  (file) =>
    (readFileSync(file, "utf8").match(literal) ?? [])
      .map((text) => text.slice(1, -1))
      .filter(
        (text) => kurdishLetters.test(text) && !arabicOnlyLetters.test(text),
      )
      .map((text) => ({ file, text })),
);

const banned: Array<[RegExp, string]> = [
  [/ڵ/, "Badini writes ل"],
  [/تکایە/, "هیڤییە"],
  [/هەوڵ/, "هەول"],
  [/ڕاستەوخۆ/, "زندی (live) or بێ ژڤان (walk-in)"],
  [/پزیشک/, "نوژدار"],
  [/وەسل/, "پسوولە"],
  [/ئێستا/, "نوکە"],
  [/ژوان/, "ژڤان"],
  [/نەخوش/, "نەخۆش"],
  [/نۆرینگەه/, "کلینیک"],
  [/وشەی نهێنی/, "پەیڤا نهێنی"],
  [/[٠-٩]/, "Western digits"],
  [new RegExp(`(?<!${letter})خۆ(?!${letter})`), "خو"],
  [new RegExp(`(?<!${letter})ر(?=${letter})`), "a word-initial ڕ"],
  [new RegExp(`(?<!${letter})(سرا|سرایێ|سرایا)(?!${letter})`), "ڕێزبەندی"],
];

describe("Badini wording in the Clinic Portal", () => {
  it("finds the Badini strings", () => {
    expect(badiniStrings.length).toBeGreaterThan(500);
  });

  it.each(banned)("never uses %s", (pattern, instead) => {
    const offenders = badiniStrings
      .filter(({ text }) => pattern.test(text))
      .map(({ file, text }) => `${file}: ${text} (use ${instead})`);
    expect(offenders).toEqual([]);
  });
});
