import type { Locale } from "@/i18n";

const en = {
  administration: "Administration",
  administrationHelp:
    "Onboard organizations and clinics for the Saxlem platform.",
  organizations: "Organizations",
  organization: "Organization",
  organizationName: "Organization name",
  organizationsHelp: "View the organizations currently registered with Saxlem.",
  createOrganization: "Create organization",
  organizationCreated: "Organization created",
  noOrganizations: "No organizations have been created yet.",
  viewOrganization: "View organization",
  clinics: "Clinics",
  clinic: "Clinic",
  clinicName: "Clinic name",
  clinicCode: "Clinic code",
  clinicsHelp: "View clinics across registered organizations.",
  createClinic: "Onboard clinic",
  clinicCreated: "Clinic created",
  noClinics: "No clinics have been created yet.",
  viewClinic: "View clinic",
  selectOrganization: "Select organization",
  clinicsInOrganization: "Clinics in organization",
  onboardClinic: "Onboard clinic",
  active: "Active",
  inactive: "Inactive",
  status: "Status",
  created: "Created",
  updated: "Updated",
  identifier: "Identifier",
  timezone: "Timezone",
  required: "This field is required.",
  invalidValue: "Enter a valid value.",
  maximumLength: "The value is too long.",
  invalidCode: "Use 2–32 letters, numbers, underscores, or hyphens.",
  invalidTimezone: "Enter an IANA timezone such as Asia/Baghdad.",
  duplicateClinicCode: "That clinic code is already used in this organization.",
  create: "Create",
  creating: "Creating…",
  cancel: "Cancel",
  retry: "Try again",
  loadMore: "Load more",
  loading: "Loading…",
  loadingOrganizations: "Loading organizations…",
  organizationSelectionLimit:
    "The organization list is too large to show safely. Review Organizations before trying again.",
  loadingClinics: "Loading clinics…",
  unavailable: "Saxlem services are temporarily unavailable.",
  forbidden: "You do not have permission to use administration.",
  sessionExpired: "Your session expired. Sign in again.",
  notFound: "The requested record could not be found.",
  failure: "Something went wrong. No unsafe change was made.",
  conflict: "This information conflicts with an existing record.",
  validation: "Review the highlighted information.",
  errorSummary: "Please correct the following:",
  operationalDetails: "Operational details",
  backToOrganizations: "Back to organizations",
  backToClinics: "Back to clinics",
  openOrganizations: "Open organizations",
  openClinics: "Open clinics",
  onboarding: "Onboarding",
};
export type AdministrationMessages = typeof en;

const ar: AdministrationMessages = {administration:"الإدارة",administrationHelp:"إضافة المؤسسات والعيادات إلى منصة ساكلم.",organizations:"المؤسسات",organization:"المؤسسة",organizationName:"اسم المؤسسة",organizationsHelp:"عرض المؤسسات المسجلة حالياً في ساكلم.",createOrganization:"إنشاء مؤسسة",organizationCreated:"تم إنشاء المؤسسة",noOrganizations:"لم يتم إنشاء أي مؤسسة بعد.",viewOrganization:"عرض المؤسسة",clinics:"العيادات",clinic:"العيادة",clinicName:"اسم العيادة",clinicCode:"رمز العيادة",clinicsHelp:"عرض العيادات التابعة للمؤسسات المسجلة.",createClinic:"إضافة عيادة",clinicCreated:"تم إنشاء العيادة",noClinics:"لم يتم إنشاء أي عيادة بعد.",viewClinic:"عرض العيادة",selectOrganization:"اختر المؤسسة",clinicsInOrganization:"عيادات المؤسسة",onboardClinic:"إضافة عيادة",active:"نشط",inactive:"غير نشط",status:"الحالة",created:"تاريخ الإنشاء",updated:"آخر تحديث",identifier:"المعرّف",timezone:"المنطقة الزمنية",required:"هذا الحقل مطلوب.",invalidValue:"أدخل قيمة صحيحة.",maximumLength:"القيمة طويلة جداً.",invalidCode:"استخدم من 2 إلى 32 حرفاً أو رقماً أو _ أو -.",invalidTimezone:"أدخل منطقة زمنية مثل Asia/Baghdad.",duplicateClinicCode:"رمز العيادة مستخدم بالفعل في هذه المؤسسة.",create:"إنشاء",creating:"جارٍ الإنشاء…",cancel:"إلغاء",retry:"حاول مجدداً",loadMore:"تحميل المزيد",loading:"جارٍ التحميل…",loadingOrganizations:"جارٍ تحميل المؤسسات…",organizationSelectionLimit:"معلومات",loadingClinics:"جارٍ تحميل العيادات…",unavailable:"خدمات ساكلم غير متاحة مؤقتاً.",forbidden:"ليس لديك صلاحية لاستخدام الإدارة.",sessionExpired:"انتهت جلستك. سجل الدخول مجدداً.",notFound:"تعذر العثور على السجل المطلوب.",failure:"حدث خطأ. لم يتم إجراء أي تغيير غير آمن.",conflict:"تتعارض هذه المعلومات مع سجل موجود.",validation:"راجع المعلومات المحددة.",errorSummary:"يرجى تصحيح ما يلي:",operationalDetails:"التفاصيل التشغيلية",backToOrganizations:"العودة إلى المؤسسات",backToClinics:"العودة إلى العيادات",openOrganizations:"فتح المؤسسات",openClinics:"العيادة مفتوحة",onboarding:"الإضافة"};

const ku: AdministrationMessages = {administration:"رێڤەبەری",administrationHelp:"رێکخراو و کلینیکان بو پلاتفورما ساخلەم زێدە بکە.",organizations:"رێکخراو",organization:"رێکخراو",organizationName:"ناڤێ رێکخراوێ",organizationsHelp:"بەری بەردەوامبوونێ زانیاریان بپشکنە.",createOrganization:"رێکخراوەکێ چێکە",organizationCreated:"رێکخراو هاتە دروستکرن",noOrganizations:"هێشتا چ رێکخراو نەهاتیە دروستکرن.",viewOrganization:"زانیاری",clinics:"کلینیک",clinic:"کلینیک",clinicName:"ناڤێ کلینیکێ",clinicCode:"کودێ کلینیکێ",clinicsHelp:"بەری بەردەوامبوونێ زانیاریان بپشکنە.",createClinic:"کلینیکەکێ زێدە بکە",clinicCreated:"کلینیک هاتە دروستکرن",noClinics:"هێشتا چ کلینیک نەهاتیە دروستکرن.",viewClinic:"زانیاری",selectOrganization:"رێکخراو هەلبژێرە",clinicsInOrganization:"کلینیکێن رێکخراوێ",onboardClinic:"کلینیکەکێ زێدە بکە",active:"چالاک",inactive:"نەچالاک",status:"رەوش",created:"هاتە چێکرن",updated:"دویماهیک نویکرن",identifier:"ناسنامە",timezone:"ناڤچەیا دەمێ",required:"ئەڤ خانە پێدڤییە.",invalidValue:"بهایەکێ دروست بنڤیسە",maximumLength:"زانیاری",invalidCode:"زانیاری",invalidTimezone:"زانیاری",duplicateClinicCode:"زانیاری",create:"دروستبکە",creating:"دهێتە دروستکرن…",cancel:"ب هەلوەشینە",retry:"دیسان هەول بدە",loadMore:"پتر بار بکە",loading:"دهێتە بارکرن…",loadingOrganizations:"رێکخراو دهێنە بارکرن…",organizationSelectionLimit:"لیستا رێکخراوان زۆر مەزنە و ب پاراستی ناهێتە نیشاندان. بەری دیسان هەول بدەی، رێکخراوان بپشکنە.",loadingClinics:"کلینیک دهێنە بارکرن…",unavailable:"بەردەست نینە",forbidden:"دەستگەهیشتن بۆ ڤێ بەشێ نینە.",sessionExpired:"دانیشتنا تە دوماهی هات. دیسان بچۆ ژوور.",notFound:"تۆمار نەهاتە دیتن.",failure:"کێشەیەک روو دا. چ گوهۆڕینەکا نەپاراستی نەهاتە کرن.",conflict:"زانیاری",validation:"زانیاری",errorSummary:"کار نەهاتە تەمامکرن.",operationalDetails:"هویرکاتیێن کارکرنێ",backToOrganizations:"ب ڤەگەرە بو رێکخراوان",backToClinics:"زانیاری",openOrganizations:"رێکخراوان ڤەکە",openClinics:"کلینیک ڤەکرییە",onboarding:"زێدەکرن"};

export const administrationMessages = (
  locale: Locale,
): AdministrationMessages => ({ en, ar, ku })[locale];
