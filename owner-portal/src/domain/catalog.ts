/** Icons the app can draw (same list as the server's catalog-rules.ts). */
export const catalogIcons = [
  ["general", "General doctor"],
  ["fever", "Fever / thermometer"],
  ["child", "Child"],
  ["tooth", "Tooth"],
  ["skin", "Skin"],
  ["heart", "Heart"],
  ["eye", "Eye"],
  ["pregnancy", "Pregnancy"],
  ["bones", "Bones and joints"],
  ["ear", "Ear"],
  ["brain", "Brain and nerves"],
  ["stomach", "Stomach"],
  ["lungs", "Lungs / breathing"],
  ["kidney", "Kidney / urinary"],
  ["mind", "Mental health"],
  ["allergy", "Allergy"],
  ["blood", "Blood"],
  ["surgery", "Surgery / wounds"],
  ["nutrition", "Nutrition"],
  ["women", "Women"],
  ["men", "Men"],
  ["elderly", "Older people"],
  ["vaccine", "Vaccines"],
  ["lab", "Lab tests"],
  ["hospital", "Hospital (default)"],
] as const;
export type CatalogIcon = (typeof catalogIcons)[number][0];
export const iconLabel = (key: string) =>
  catalogIcons.find(([value]) => value === key)?.[1] ?? key;

/** Tile colours, as the app shows them. */
export const concernTones = [
  ["blue", "Blue", "#e7edff", "#2f5bf0"],
  ["rose", "Rose", "#ffe4ea", "#a3214a"],
  ["amber", "Amber", "#fff1d6", "#8a5a00"],
  ["aqua", "Aqua", "#ddf5f3", "#07706b"],
  ["lilac", "Lilac", "#efe7ff", "#5b3fb5"],
] as const;
export type ConcernTone = (typeof concernTones)[number][0];
export const tone = (key: string) =>
  concernTones.find(([value]) => value === key) ?? concernTones[0];

export const SPECIALTY_NAME_MAX = 120;
export const CONCERN_LABEL_MAX = 60;
export const CONCERNS_ACTIVE_MAX = 24;

/** The code the server makes from an English name (shown before saving). */
export function specialtyCode(englishName: string): string {
  const slug = englishName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^[0-9-]+/, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug.length >= 2 ? slug : "";
}
