import type { BackendConfiguration } from '../../config/environment';

/**
 * Everything the owner can change from the Owner Portal → App settings,
 * without a new app or server release. Each entry has a built-in default
 * (the value Saxlem shipped with; server env values where one existed) and
 * hard limits so a typo can't break the app. A missing database row means
 * "use the default".
 *
 * Public settings are sent to the app (GET /app/config); the rest are read
 * only by the server.
 */
export type SettingValue = boolean | number | string;
export type SettingKind = 'boolean' | 'integer' | 'phone' | 'url' | 'text';

export const SETTING_GROUPS = {
  contact: 'Contact and help',
  features: 'Features',
  home: 'Home screen',
  booking: 'Booking',
  leaveBy: 'Leave by',
  reminders: 'Reminders',
  earlierTime: 'Earlier time',
  reviews: 'Reviews',
  reception: 'Reception and live queue',
  payments: 'Payments',
  limits: 'Limits',
} as const;
export type SettingGroup = keyof typeof SETTING_GROUPS;

export interface SettingDefinition {
  readonly key: string;
  readonly group: SettingGroup;
  readonly label: string;
  readonly help: string;
  readonly kind: SettingKind;
  readonly unit?:
    'minutes' | 'hours' | 'days' | 'IQD' | 'people' | 'items' | 'characters';
  readonly min?: number;
  readonly max?: number;
  readonly public: boolean;
  /**
   * The built-in default. Env-backed ones read the server configuration
   * (when it is missing or partial, Saxlem's shipped value).
   */
  readonly fallback: (
    configuration: BackendConfiguration | undefined,
  ) => SettingValue;
}

const constant = (value: SettingValue) => () => value;

export const SETTINGS: readonly SettingDefinition[] = [
  // Contact and help
  {
    key: 'contact.emergencyNumber',
    group: 'contact',
    label: 'Emergency number',
    help: 'Called from the Emergency card on Home (after the patient confirms).',
    kind: 'phone',
    public: true,
    fallback: constant('122'),
  },
  {
    key: 'contact.supportWhatsApp',
    group: 'contact',
    label: 'Support WhatsApp',
    help: 'International digits, e.g. 9647501234567. Empty hides "Chat with us".',
    kind: 'phone',
    public: true,
    fallback: constant(''),
  },
  {
    key: 'contact.termsUrl',
    group: 'contact',
    label: 'Terms of use page',
    help: 'Full https link. Empty hides the link in the app.',
    kind: 'url',
    public: true,
    fallback: constant(''),
  },
  {
    key: 'contact.privacyUrl',
    group: 'contact',
    label: 'Privacy policy page',
    help: 'Full https link. Empty hides the link in the app.',
    kind: 'url',
    public: true,
    fallback: constant(''),
  },
  // Features
  {
    key: 'features.reviews',
    group: 'features',
    label: 'Reviews',
    help: 'Patients rate visits and see ratings. Off: no new reviews, ratings hidden.',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  },
  {
    key: 'features.earlierTime',
    group: 'features',
    label: '"Tell me if an earlier time opens"',
    help: 'Off: the switch disappears and no new offers are sent.',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  },
  {
    key: 'features.leaveBy',
    group: 'features',
    label: '"Leave by" from the patient\'s location',
    help: 'Off: the app stops showing when to leave and "I\'m on my way".',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  },
  {
    key: 'features.savedDoctors',
    group: 'features',
    label: 'Saved doctors',
    help: 'The heart on doctor pages and the strip on Home.',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  },
  {
    key: 'features.onlinePayments',
    group: 'features',
    label: 'Pay in the app with FIB',
    help: 'Only works once FIB is set up on the server. Off: patients pay at the clinic.',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  },
  // Home
  ...(
    [
      ['concerns', '"What\'s bothering you?" tiles'],
      ['freeToday', 'Doctors free today'],
      ['specialties', 'Specialties strip'],
      ['bookAgain', 'Book again'],
      ['howItWorks', '"How Saxlem works" (shown before the first booking)'],
      ['emergency', 'Emergency card'],
    ] as const
  ).map(([name, label]): SettingDefinition => ({
    key: `home.${name}`,
    group: 'home',
    label,
    help: 'Show this section on Home.',
    kind: 'boolean',
    public: true,
    fallback: constant(true),
  })),
  // Booking
  {
    key: 'booking.daysAhead',
    group: 'booking',
    label: 'How far ahead patients can book',
    help: 'Days shown in the app, today included.',
    kind: 'integer',
    unit: 'days',
    min: 1,
    max: 60,
    public: true,
    fallback: constant(14),
  },
  {
    key: 'booking.defaultVisitMinutes',
    group: 'booking',
    label: 'Default visit length',
    help: 'For doctors without their own visit length.',
    kind: 'integer',
    unit: 'minutes',
    min: 5,
    max: 240,
    public: false,
    fallback: (c) => c?.appointmentFoundationDurationMinutes ?? 30,
  },
  {
    key: 'booking.defaultFeeIqd',
    group: 'booking',
    label: 'Default first-visit fee',
    help: 'For doctors without their own fee.',
    kind: 'integer',
    unit: 'IQD',
    min: 0,
    max: 5_000_000,
    public: false,
    fallback: (c) => c?.appointmentFoundationFeeIqd ?? 25_000,
  },
  // Leave by
  {
    key: 'leaveBy.checkInFirstVisit',
    group: 'leaveBy',
    label: 'Check-in time, first visit',
    help: 'How early patients should be at reception for a first visit.',
    kind: 'integer',
    unit: 'minutes',
    min: 0,
    max: 60,
    public: false,
    fallback: constant(10),
  },
  {
    key: 'leaveBy.checkInFollowUp',
    group: 'leaveBy',
    label: 'Check-in time, follow-up',
    help: 'How early patients should be at reception for a follow-up.',
    kind: 'integer',
    unit: 'minutes',
    min: 0,
    max: 60,
    public: false,
    fallback: constant(5),
  },
  {
    key: 'leaveBy.parkAndWalk',
    group: 'leaveBy',
    label: 'Parking and walking in',
    help: 'Added to every drive.',
    kind: 'integer',
    unit: 'minutes',
    min: 0,
    max: 30,
    public: false,
    fallback: constant(5),
  },
  // Reminders
  {
    key: 'reminders.dayBefore',
    group: 'reminders',
    label: 'Reminder the day before',
    help: 'For visits booked at least a day ahead.',
    kind: 'boolean',
    public: false,
    fallback: constant(true),
  },
  {
    key: 'reminders.soon',
    group: 'reminders',
    label: 'Reminder 2 hours before',
    help: 'For visits booked at least 2 hours ahead.',
    kind: 'boolean',
    public: false,
    fallback: constant(true),
  },
  {
    key: 'reminders.almostTurnAhead',
    group: 'reminders',
    label: '"Almost your turn" when this many are ahead',
    help: 'Sent once per visit.',
    kind: 'integer',
    unit: 'people',
    min: 1,
    max: 10,
    public: false,
    fallback: constant(2),
  },
  // Earlier time
  {
    key: 'earlierTime.minLeadHours',
    group: 'earlierTime',
    label: 'Offered only for visits at least',
    help: 'Hours away when the patient turns it on.',
    kind: 'integer',
    unit: 'hours',
    min: 1,
    max: 72,
    public: true,
    fallback: constant(3),
  },
  {
    key: 'earlierTime.fromNowHours',
    group: 'earlierTime',
    label: 'Earliest time offered',
    help: 'Hours from now, so the patient can get there.',
    kind: 'integer',
    unit: 'hours',
    min: 1,
    max: 48,
    public: false,
    fallback: constant(2),
  },
  {
    key: 'earlierTime.byMinutes',
    group: 'earlierTime',
    label: 'Must be earlier by at least',
    help: 'Smaller moves are not worth a notification.',
    kind: 'integer',
    unit: 'minutes',
    min: 15,
    max: 600,
    public: false,
    fallback: constant(30),
  },
  {
    key: 'earlierTime.offerEveryHours',
    group: 'earlierTime',
    label: 'At most one offer every',
    help: 'Per visit.',
    kind: 'integer',
    unit: 'hours',
    min: 1,
    max: 72,
    public: false,
    fallback: constant(6),
  },
  // Reviews
  {
    key: 'reviews.windowDays',
    group: 'reviews',
    label: 'Patients can review a visit for',
    help: 'Days after the visit.',
    kind: 'integer',
    unit: 'days',
    min: 1,
    max: 365,
    public: false,
    fallback: constant(30),
  },
  {
    key: 'reviews.commentMax',
    group: 'reviews',
    label: 'Longest review comment',
    help: 'Characters.',
    kind: 'integer',
    unit: 'characters',
    min: 50,
    max: 2000,
    public: true,
    fallback: constant(500),
  },
  // Reception and live queue
  {
    key: 'reception.arrivalEarlyMinutes',
    group: 'reception',
    label: 'Check-in opens',
    help: 'Minutes before the visit time.',
    kind: 'integer',
    unit: 'minutes',
    min: 0,
    max: 1440,
    public: false,
    fallback: (c) => c?.arrivalEarlyWindowMinutes ?? 60,
  },
  {
    key: 'reception.arrivalLateMinutes',
    group: 'reception',
    label: 'Check-in closes',
    help: 'Minutes after the visit time.',
    kind: 'integer',
    unit: 'minutes',
    min: 0,
    max: 1440,
    public: false,
    fallback: (c) => c?.arrivalLateWindowMinutes ?? 120,
  },
  {
    key: 'reception.recallGraceMinutes',
    group: 'reception',
    label: 'Called patient has',
    help: 'Minutes to come in before they count as not responding (new queues).',
    kind: 'integer',
    unit: 'minutes',
    min: 1,
    max: 60,
    public: false,
    fallback: (c) => c?.queueRecallGraceMinutes ?? 5,
  },
  {
    key: 'reception.fallbackConsultationMinutes',
    group: 'reception',
    label: 'Wait estimate per patient',
    help: 'Used until the queue has learned from real visits.',
    kind: 'integer',
    unit: 'minutes',
    min: 3,
    max: 120,
    public: false,
    fallback: (c) => c?.queueFallbackConsultationMinutes ?? 20,
  },
  // Payments
  {
    key: 'payments.linkMinutes',
    group: 'payments',
    label: 'FIB payment link stays open for',
    help: 'After that the patient starts a new payment or pays at the clinic.',
    kind: 'integer',
    unit: 'minutes',
    min: 6,
    max: 2880,
    public: false,
    fallback: (c) => c?.paymentLinkMinutes ?? 30,
  },
  // Limits
  {
    key: 'limits.savedDoctors',
    group: 'limits',
    label: 'Saved doctors per account',
    help: 'Most a patient account can keep.',
    kind: 'integer',
    unit: 'items',
    min: 10,
    max: 500,
    public: false,
    fallback: constant(100),
  },
];

export const SETTINGS_BY_KEY: ReadonlyMap<string, SettingDefinition> = new Map(
  SETTINGS.map((definition) => [definition.key, definition]),
);

/** Checks a value against its definition; returns the clean value or an error. */
export function checkSetting(
  definition: SettingDefinition,
  value: unknown,
): { ok: true; value: SettingValue } | { ok: false; error: string } {
  switch (definition.kind) {
    case 'boolean':
      return typeof value === 'boolean'
        ? { ok: true, value }
        : { ok: false, error: 'Use on or off.' };
    case 'integer': {
      if (typeof value !== 'number' || !Number.isSafeInteger(value))
        return { ok: false, error: 'Use a whole number.' };
      if (
        (definition.min !== undefined && value < definition.min) ||
        (definition.max !== undefined && value > definition.max)
      )
        return {
          ok: false,
          error: `Use a number from ${definition.min} to ${definition.max}.`,
        };
      return { ok: true, value };
    }
    case 'phone': {
      if (typeof value !== 'string') return { ok: false, error: 'Use digits.' };
      const digits = value.replace(/[\s-]/g, '');
      if (digits === '' && definition.key !== 'contact.emergencyNumber')
        return { ok: true, value: '' };
      return /^\+?[0-9]{2,15}$/.test(digits)
        ? { ok: true, value: digits.replace(/^\+/, '') }
        : { ok: false, error: 'Use 2 to 15 digits.' };
    }
    case 'url': {
      if (typeof value !== 'string') return { ok: false, error: 'Use a link.' };
      const trimmed = value.trim();
      if (trimmed === '') return { ok: true, value: '' };
      try {
        const url = new URL(trimmed);
        return url.protocol === 'https:' && trimmed.length <= 500
          ? { ok: true, value: url.toString() }
          : { ok: false, error: 'Use a full https:// link.' };
      } catch {
        return { ok: false, error: 'Use a full https:// link.' };
      }
    }
    case 'text': {
      if (typeof value !== 'string' || value.trim().length > 200)
        return { ok: false, error: 'Use up to 200 characters.' };
      return { ok: true, value: value.trim() };
    }
  }
}
