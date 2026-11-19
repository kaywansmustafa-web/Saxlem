import {
  readNotificationContext,
  type PatientNotificationContext,
} from '../../../common/notifications/patient-notifications';

export type PushLocale = 'en' | 'ar' | 'ku';
export const PUSH_LOCALES: readonly PushLocale[] = ['en', 'ar', 'ku'];

/** The same words the app's inbox uses, so a push and its inbox item match. */
const TITLES: Record<string, Record<PushLocale, string>> = {
  'appointment.booked': {
    en: 'Booking confirmed',
    ar: 'تم تأكيد الحجز',
    ku: 'ژڤانا تە هاتە پشتڕاستکرن',
  },
  'appointment.cancelled.by-clinic': {
    en: 'The clinic cancelled your visit',
    ar: 'ألغت العيادة موعدك',
    ku: 'کلینیکێ ژڤانا تە هەلوەشاند',
  },
  'appointment.rescheduled.by-clinic': {
    en: 'Your visit has a new time',
    ar: 'تم تغيير موعدك',
    ku: 'ژڤانا تە دەمەکێ نوی هەیە',
  },
  'appointment.reminder.day-before': {
    en: 'Your visit is tomorrow',
    ar: 'موعدك غداً',
    ku: 'ژڤانا تە سوبەهی یە',
  },
  'appointment.reminder.soon': {
    en: 'Your visit is soon',
    ar: 'موعدك قريب',
    ku: 'ژڤانا تە نێزیکە',
  },
  'appointment.review.requested': {
    en: 'How was your visit?',
    ar: 'كيف كانت زيارتك؟',
    ku: 'سەرەدانا تە چاوا بوو؟',
  },
  'appointment.earlier.available': {
    en: 'An earlier time is free',
    ar: 'يتوفر موعد أبكر',
    ku: 'دەمەکێ زووتر ڤالا بوو',
  },
  'queue.patient.almost': {
    en: 'Almost your turn',
    ar: 'اقترب دورك',
    ku: 'نۆرا تە نێزیک بوو',
  },
  'queue.session.opened': {
    en: 'The queue is open',
    ar: 'بدأ الطابور',
    ku: 'ڕێزبەندی ڤەبوو',
  },
  'queue.session.paused': {
    en: 'The queue is paused',
    ar: 'توقف الطابور مؤقتاً',
    ku: 'ڕێزبەندی بۆ دەمەکێ کورت راوەستایە',
  },
  'queue.session.resumed': {
    en: 'The queue is moving again',
    ar: 'عاد الطابور للحركة',
    ku: 'ڕێزبەندی دیسان دەست پێ کر',
  },
  'queue.session.closed': {
    en: 'The queue is closed',
    ar: 'أُغلق الطابور',
    ku: 'ڕێزبەندی هاتە گرتن',
  },
  'queue.entry.enqueued': {
    en: "You're in the queue",
    ar: 'أنت في الطابور',
    ku: 'تو د ڕێزبەندیێ دا یی',
  },
  'queue.patient.called': {
    en: "It's your turn",
    ar: 'حان دورك',
    ku: 'نۆرا تە یە',
  },
  'queue.patient.recalled': {
    en: "It's your turn",
    ar: 'حان دورك',
    ku: 'نۆرا تە یە',
  },
  'queue.patient.no-response': {
    en: 'You missed your turn',
    ar: 'فاتك دورك',
    ku: 'نۆرا تە بۆری',
  },
  'queue.consultation.started': {
    en: 'Your consultation has started',
    ar: 'بدأت معاينتك',
    ku: 'ڕاوێژا تە دەست پێ کر',
  },
  'queue.consultation.completed': {
    en: 'Visit finished',
    ar: 'انتهت زيارتك',
    ku: 'سەرەدانا تە ب دوماهی هات',
  },
};

/** What to do next, used when there is no doctor or time to show. */
const NEXT: Record<string, Record<PushLocale, string>> = {
  'appointment.review.requested': {
    en: 'Rate it in a few seconds. It helps other patients choose.',
    ar: 'قيّمها في ثوانٍ. هذا يساعد المرضى الآخرين على الاختيار.',
    ku: 'د چەند چرکەیان دا هەلسەنگاندنێ بکە. ئەڤە هاریکاریا نەخۆشێن دی دکەت دا نوژدارەکێ هەلبژێرن.',
  },
  'appointment.earlier.available': {
    en: 'Open your visit to move to it. Whoever confirms first gets it.',
    ar: 'افتح موعدك لتنتقل إليه. من يؤكد أولًا يحصل عليه.',
    ku: 'ژڤانا خو ڤەکە و بۆ ڤی دەمێ زووتر بگوهێزە. یێ زووترین پشتڕاست بکەت، ئەو دەم وەردگریت.',
  },
  'queue.patient.almost': {
    en: 'Make your way to the waiting area and stay close.',
    ar: 'توجّه إلى صالة الانتظار وابقَ قريباً.',
    ku: 'بچە جهێ چاڤەڕێبوونێ و نێزیک بمینە.',
  },
  'queue.patient.called': {
    en: 'Please go in to the doctor now.',
    ar: 'تفضّل بالدخول إلى الطبيب الآن.',
    ku: 'هیڤییە نوکە بچە ژوور بۆ دەڤ نوژداری.',
  },
  'queue.patient.no-response': {
    en: 'Speak to reception — they can put you back in the queue.',
    ar: 'تحدّث مع الاستقبال، يمكنهم إعادتك إلى الطابور.',
    ku: 'دگەل کارمەندێ پێشوازیێ باخڤە؛ ئەو دشێن تە دیسان بخەنە ڕێزبەندیێ.',
  },
};
NEXT['queue.patient.recalled'] = NEXT['queue.patient.called']!;

const MONTHS: Record<PushLocale, readonly string[]> = {
  en: 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '),
  ar: [
    'كانون الثاني',
    'شباط',
    'آذار',
    'نيسان',
    'أيار',
    'حزيران',
    'تموز',
    'آب',
    'أيلول',
    'تشرين الأول',
    'تشرين الثاني',
    'كانون الأول',
  ],
  ku: [
    'کانوونا دووێ',
    'شوبات',
    'ئادار',
    'نیسان',
    'گولان',
    'حزیران',
    'تیرمەه',
    'تەباخ',
    'ئیلوون',
    'چریا ئێکێ',
    'چریا دووێ',
    'کانوونا ئێکێ',
  ],
};

const TICKET: Record<PushLocale, (n: number) => string> = {
  en: (n) => `Ticket ${n}`,
  ar: (n) => `رقم ${n}`,
  ku: (n) => `ژمارا تیکێتێ ${n}`,
};

function ahead(count: number, locale: PushLocale): string {
  if (locale === 'ar')
    return count === 0
      ? 'لا أحد قبلك'
      : count === 1
        ? 'شخص واحد قبلك'
        : count === 2
          ? 'شخصان قبلك'
          : count <= 10
            ? `${count} أشخاص قبلك`
            : `${count} شخصاً قبلك`;
  if (locale === 'ku')
    return count === 0
      ? 'کەس بەری تە نینە'
      : count === 1
        ? 'ئێک کەس بەری تە یە'
        : `${count} کەس بەری تە نە`;
  return count === 0
    ? 'Nobody ahead of you'
    : count === 1
      ? '1 person ahead of you'
      : `${count} people ahead of you`;
}

/** "19 Nov · 10:30" at the clinic (Iraq is UTC+3 all year). */
export function clinicMoment(iso: string, locale: PushLocale): string | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  const at = new Date(instant.getTime() + 3 * 3_600_000);
  const time = `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
  return `${at.getUTCDate()} ${MONTHS[locale][at.getUTCMonth()]} · ${time}`;
}

const join = (parts: (string | null | undefined)[]) =>
  parts.filter((part): part is string => !!part && !!part.trim()).join(' · ');

/**
 * The push for a notification record, in the phone's language. Null for
 * types that are not pushed (staff-only or unknown).
 */
export function pushMessage(
  type: string,
  payload: unknown,
  locale: PushLocale,
): { title: string; body: string } | null {
  const title = TITLES[type]?.[locale];
  if (!title) return null;
  const context: PatientNotificationContext =
    readNotificationContext(payload) ?? {};
  const ticket =
    context.ticketNumber !== undefined
      ? TICKET[locale](context.ticketNumber)
      : null;
  const when = context.startsAt ? clinicMoment(context.startsAt, locale) : null;
  let body: string;
  if (type.startsWith('appointment.')) body = join([context.doctorName, when]);
  else if (type === 'queue.patient.almost')
    body = join([
      ticket,
      context.ahead !== undefined ? ahead(context.ahead, locale) : null,
    ]);
  else body = join([ticket, context.doctorName]);
  if (!body) body = NEXT[type]?.[locale] ?? '';
  // Phones lay out a notification by its first letter, so one that starts
  // with a doctor's name in Latin letters would run left to right. A
  // right-to-left mark keeps Kurdish and Arabic pushes right to left.
  const rtl = locale === 'en' ? '' : '\u200F';
  return { title: rtl + title, body: body ? rtl + body : body };
}
