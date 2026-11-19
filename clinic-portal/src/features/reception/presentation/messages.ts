import type { Locale } from "@/i18n";

const en = {
  chooseTitle: "Which doctor do you work for?",
  chooseBody:
    "Most receptionists work for one doctor. Your board, list, queue and bookings will show only the doctors you choose. You can add more later, for example when you cover for a colleague.",
  myDoctors: "My doctors",
  change: "Add or remove",
  editTitle: "My doctors",
  editBody:
    "Choose the doctors you work for. Usually one; add more if you are covering for someone.",
  save: "Save",
  saving: "Saving...",
  close: "Cancel",
  atLeastOne: "Choose at least one doctor.",
  failed: "Couldn't save. Try again.",
  noDoctors:
    "There are no active doctors at this clinic yet. Ask the clinic owner to add one.",
};
export type ReceptionMessages = typeof en;

const ar: ReceptionMessages = {
  chooseTitle: "مع أي طبيب تعمل؟",
  chooseBody:
    "يعمل معظم موظفي الاستقبال مع طبيب واحد. ستعرض اللوحة والقائمة والطابور والحجوزات الأطباء الذين تختارهم فقط. يمكنك إضافة المزيد لاحقاً، مثلاً عند تغطية زميل.",
  myDoctors: "أطبائي",
  change: "إضافة أو إزالة",
  editTitle: "أطبائي",
  editBody:
    "اختر الأطباء الذين تعمل معهم. عادةً طبيب واحد؛ أضف آخرين إذا كنت تغطي عن زميل.",
  save: "حفظ",
  saving: "جارٍ الحفظ...",
  close: "إلغاء",
  atLeastOne: "اختر طبيباً واحداً على الأقل.",
  failed: "تعذّر الحفظ. حاول مرة أخرى.",
  noDoctors:
    "لا يوجد أطباء فعّالون في هذه العيادة بعد. اطلب من مالك العيادة إضافة طبيب.",
};

const ku: ReceptionMessages = {
  chooseTitle: "تو دگەل کیژ نوژداری کار دکەی؟",
  chooseBody:
    "پترانیا کارمەندێن پێشوازیێ دگەل ئێک نوژداری کار دکەن. تەختە، لیست، ڕێزبەندی و ژڤانێن تە تنێ ئەو نوژدارێن تو هەلدبژێری نیشان ددەن. پاشی دشێی پتر زێدە بکەی، بۆ نموونە دەمێ تو جهێ هەڤالەکی دگری.",
  myDoctors: "نوژدارێن من",
  change: "زێدە بکە یان لابە",
  editTitle: "نوژدارێن من",
  editBody:
    "ئەو نوژدارێن تو دگەل کار دکەی هەلبژێرە. ب گشتی ئێک؛ پتر زێدە بکە ئەگەر تو جهێ کەسەکی دگری.",
  save: "پاشەکەفت بکە",
  saving: "پاشەکەفت دبیت…",
  close: "هەلوەشینە",
  atLeastOne: "لانیکێم ئێک نوژداری هەلبژێرە.",
  failed: "پاشەکەفت نەبوو. دیسان هەول بدە.",
  noDoctors:
    "هێشتا چ نوژدارێن چالاک د ڤێ کلینیکێ دا نینن. داخوازێ ژ خودانێ کلینیکێ بکە کو ئێکی زێدە بکەت.",
};

export const receptionMessages = (locale: Locale): ReceptionMessages =>
  locale === "ar" ? ar : locale === "ku" ? ku : en;
