import type { Locale } from "@/i18n";

const en = {
  payment: "Payment",
  amount: "Amount",
  method: "Method",
  counter: "At the counter",
  online: "Online (FIB)",
  paidAt: "Paid at",
  dueAtCounter: "Pay at counter",
  pending: "Paying in app",
  paid: "Paid",
  expired: "Not completed",
  cancelled: "Not completed",
  refundPending: "Refund in progress",
  refunded: "Refunded",
  refundFailed: "Refund by hand",
  void: "Nothing due",
  markPaid: "Mark as paid",
  markPaidTitle: "Record a counter payment",
  markPaidBody:
    "Confirm the patient paid {amount} at the counter. This is recorded with your name.",
  confirm: "Confirm payment",
  cancel: "Cancel",
  saving: "Saving…",
  recorded: "Payment recorded.",
  paidInApp: "The patient already paid in the app. Nothing to collect.",
  pendingHint:
    "The patient is paying in the app. If they pay you instead, mark it as paid and the app link is closed.",
  refundFailedHint:
    "The automatic refund did not go through. Refund the patient by hand.",
  failed: "The payment could not be recorded. Try again.",
  unavailable: "Payment status is unavailable right now.",
};

export type PaymentMessages = typeof en;

const ar: PaymentMessages = {
  payment: "الدفع",
  amount: "المبلغ",
  method: "طريقة الدفع",
  counter: "عند الاستقبال",
  online: "عبر التطبيق (FIB)",
  paidAt: "وقت الدفع",
  dueAtCounter: "الدفع عند الاستقبال",
  pending: "يدفع عبر التطبيق",
  paid: "مدفوع",
  expired: "لم يكتمل",
  cancelled: "لم يكتمل",
  refundPending: "الاسترداد قيد التنفيذ",
  refunded: "تم الاسترداد",
  refundFailed: "استرداد يدوي",
  void: "لا يوجد مبلغ مستحق",
  markPaid: "تسجيل كمدفوع",
  markPaidTitle: "تسجيل دفعة عند الاستقبال",
  markPaidBody: "أكّد أن المريض دفع {amount} عند الاستقبال. سيُسجَّل ذلك باسمك.",
  confirm: "تأكيد الدفع",
  cancel: "إلغاء",
  saving: "جارٍ الحفظ…",
  recorded: "تم تسجيل الدفعة.",
  paidInApp: "دفع المريض عبر التطبيق مسبقاً. لا يوجد ما يُحصَّل.",
  pendingHint:
    "المريض يدفع عبر التطبيق. إذا دفع لك مباشرة، سجّل الدفعة وسيُغلق رابط التطبيق.",
  refundFailedHint: "لم ينجح الاسترداد التلقائي. أعد المبلغ للمريض يدوياً.",
  failed: "تعذّر تسجيل الدفعة. حاول مجدداً.",
  unavailable: "حالة الدفع غير متاحة الآن.",
};

const ku: PaymentMessages = {
  payment: "پارەدان",
  amount: "بڕ",
  method: "ڕێکا پارەدانێ",
  counter: "ل پێشوازیێ",
  online: "ئۆنلاین (FIB)",
  paidAt: "دەمێ پارەدانێ",
  dueAtCounter: "پارەدان ل پێشوازیێ",
  pending: "د ئەپی دا پارەی ددەت",
  paid: "پارە هاتیە دان",
  expired: "تەمام نەبوو",
  cancelled: "تەمام نەبوو",
  refundPending: "ڤەگەڕاندنا پارەی ل ڕێیێ",
  refunded: "پارە هاتە ڤەگەڕاندن",
  refundFailed: "ب دەستی ڤەگەڕینە",
  void: "چ پارە نینە",
  markPaid: "وەک دایی تۆمار بکە",
  markPaidTitle: "تۆمارکرنا پارەدانێ ل پێشوازیێ",
  markPaidBody:
    "پشتڕاست بکە کو نەخۆشی {amount} ل پێشوازیێ دایە. ئەڤە ب ناڤێ تە دهێتە تۆمارکرن.",
  confirm: "پارەدانێ پشتڕاست بکە",
  cancel: "هەلوەشینە",
  saving: "دهێتە پاراستن…",
  recorded: "پارەدان هاتە تۆمارکرن.",
  paidInApp: "نەخۆشی د ئەپی دا پارە دایە. چ پارە نینە بۆ وەرگرتنێ.",
  pendingHint:
    "نەخۆش د ئەپی دا پارەی ددەت. ئەگەر پارە دا تە، وەک دایی تۆمار بکە و لینکا ئەپی دێ هێتە گرتن.",
  refundFailedHint:
    "ڤەگەڕاندنا ئۆتۆماتیکی سەرنەکەفت. پارەی ب دەستی بۆ نەخۆشی ڤەگەڕینە.",
  failed: "پارەدان نەهاتە تۆمارکرن. دیسان هەول بدە.",
  unavailable: "ڕەوشا پارەدانێ نوکە بەردەست نینە.",
};

export function paymentMessages(locale: Locale): PaymentMessages {
  return locale === "ar" ? ar : locale === "ku" ? ku : en;
}

export function paymentTone(
  status: keyof Pick<
    PaymentMessages,
    | "dueAtCounter"
    | "pending"
    | "paid"
    | "expired"
    | "cancelled"
    | "refundPending"
    | "refunded"
    | "refundFailed"
    | "void"
  >,
): "positive" | "info" | "warning" | "neutral" {
  if (status === "paid" || status === "refunded") return "positive";
  if (status === "pending" || status === "refundPending") return "info";
  if (
    status === "refundFailed" ||
    status === "expired" ||
    status === "cancelled"
  )
    return "warning";
  return "neutral";
}
