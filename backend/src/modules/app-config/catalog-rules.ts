/**
 * Icons the app can draw for specialties and Home tiles. The Owner Portal
 * offers exactly these; the app maps each key to an icon (unknown keys fall
 * back to "hospital", so an older app never breaks on a newer key).
 */
export const CATALOG_ICONS = [
  'general',
  'fever',
  'child',
  'tooth',
  'skin',
  'heart',
  'eye',
  'pregnancy',
  'bones',
  'ear',
  'brain',
  'stomach',
  'lungs',
  'kidney',
  'mind',
  'allergy',
  'blood',
  'surgery',
  'nutrition',
  'women',
  'men',
  'elderly',
  'vaccine',
  'lab',
  'hospital',
] as const;
export type CatalogIcon = (typeof CATALOG_ICONS)[number];

/** Tile colours (Design A tones). */
export const CONCERN_TONES = [
  'blue',
  'rose',
  'amber',
  'aqua',
  'lilac',
] as const;
export type ConcernTone = (typeof CONCERN_TONES)[number];

export const SPECIALTY_NAME_MAX = 120;
export const CONCERN_LABEL_MAX = 60;
/** At most this many tiles are active at once (Home shows them 4 per row). */
export const CONCERNS_ACTIVE_MAX = 24;

/**
 * A specialty's permanent code from its English name: "Ear, Nose & Throat"
 * becomes "ear-nose-throat". Codes never change after creation, because
 * doctor search links and saved filters use them.
 */
export function specialtyCode(englishName: string): string {
  const slug = englishName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[0-9-]+/, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug.length >= 2 ? slug : '';
}

/** Trims a name; empty optional names become null ("use English"). */
export function optionalName(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}
