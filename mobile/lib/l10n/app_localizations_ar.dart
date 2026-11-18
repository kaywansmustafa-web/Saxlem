// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'ساكسلم';

  @override
  String get chooseLanguage => 'اختر لغتك';

  @override
  String get languageCanChange => 'يمكنك تغييرها لاحقاً من ملفك الشخصي.';

  @override
  String get badiniKurdish => 'الكردية البادينية';

  @override
  String get english => 'الإنجليزية';

  @override
  String get arabic => 'العربية';

  @override
  String get continueLabel => 'متابعة';

  @override
  String get savingLanguage => 'جارٍ حفظ اللغة';

  @override
  String get languageSaveFailed => 'تعذر حفظ لغتك. يرجى المحاولة مرة أخرى.';

  @override
  String get home => 'الرئيسية';

  @override
  String get discover => 'اكتشف';

  @override
  String get appointments => 'المواعيد';

  @override
  String get alerts => 'التنبيهات';

  @override
  String get profile => 'الملف الشخصي';

  @override
  String get alertsTitle => 'التنبيهات قريباً';

  @override
  String get alertsBody =>
      'ستظهر هنا تحديثات المواعيد والعيادات المهمة في إصدار قادم.';

  @override
  String get profileTitle => 'ملفك الشخصي قريباً';

  @override
  String get profileBody =>
      'ستتمكن هنا من إدارة بياناتك ولغتك وتفضيلات الرعاية.';

  @override
  String get goodMorning => 'صباح الخير،';

  @override
  String get goodAfternoon => 'مساء الخير،';

  @override
  String get goodEvening => 'مساء الخير،';

  @override
  String get searchHint => 'ابحث عن الأطباء أو العيادات أو الاختصاصات';

  @override
  String get openHealthcareSearch => 'فتح البحث الصحي';

  @override
  String get openSearchFilters => 'فتح مرشحات البحث';

  @override
  String get liveQueue => 'قائمة الانتظار المباشرة';

  @override
  String get live => 'مباشر';

  @override
  String get currentPatient => 'المريض الحالي';

  @override
  String get yourNumber => 'رقمك';

  @override
  String get patientsAhead => 'المرضى قبلك';

  @override
  String get estimatedWait => 'وقت الانتظار المتوقع';

  @override
  String get doctorStatus => 'حالة الطبيب';

  @override
  String get minutesShort => 'د';

  @override
  String get viewLiveQueue => 'عرض الطابور المباشر';

  @override
  String get popularSpecialties => 'الاختصاصات الشائعة';

  @override
  String get recommendedDoctors => 'أطباء مقترحون';

  @override
  String get seeAll => 'عرض الكل';

  @override
  String get book => 'احجز';

  @override
  String get filters => 'عوامل التصفية';

  @override
  String get sortResults => 'ترتيب النتائج';

  @override
  String get tryAgain => 'حاول مجدداً';

  @override
  String get clearFilters => 'مسح عوامل التصفية';

  @override
  String get findRightCare => 'اعثر على الرعاية المناسبة';

  @override
  String get findRightCareBody =>
      'ابحث بكلمات بسيطة وسنساعدك في العثور على الطبيب المناسب.';

  @override
  String get quickCategories => 'فئات سريعة';

  @override
  String get doctorProfile => 'ملف الطبيب';

  @override
  String get viewProfile => 'عرض الملف';

  @override
  String get addToMyDoctors => 'إضافة إلى أطبائي';

  @override
  String get removeFromMyDoctors => 'إزالة من أطبائي';

  @override
  String get bookAppointment => 'حجز موعد';

  @override
  String get chooseAppointment => 'اختر موعداً';

  @override
  String get chooseClinic => 'اختر العيادة';

  @override
  String get chooseDate => 'اختر التاريخ';

  @override
  String get chooseTime => 'اختر الوقت';

  @override
  String get appointmentType => 'نوع الموعد';

  @override
  String get initialAppointment => 'موعد أولي';

  @override
  String get followUpAppointment => 'موعد متابعة';

  @override
  String get appointmentReason => 'سبب الزيارة';

  @override
  String get checkAvailability => 'تحقق من المواعيد المتاحة';

  @override
  String get noAvailableSlots => 'لا توجد أوقات متاحة ضمن هذه الفترة.';

  @override
  String get timezone => 'المنطقة الزمنية';

  @override
  String get bookingTimeout =>
      'انتهت مهلة طلب المواعيد المتاحة. حاول مرة أخرى.';

  @override
  String get slotTaken => 'لم يعد هذا الوقت متاحاً. تحقق من المواعيد مرة أخرى.';

  @override
  String get bookingValidationFailure => 'راجع تفاصيل الحجز وحاول مرة أخرى.';

  @override
  String get bookingUnknownOutcome =>
      'تعذر تأكيد النتيجة. لا تنشئ حجزاً آخر قبل إعادة محاولة هذا الطلب.';

  @override
  String get bookingSuccessful => 'تم حجز موعدك.';

  @override
  String appointmentReferenceValue(String reference) {
    return 'مرجع الموعد $reference';
  }

  @override
  String get reviewAppointment => 'مراجعة الموعد';

  @override
  String get confirmAppointment => 'تأكيد الموعد';

  @override
  String get confirmingAppointment => 'جارٍ تأكيد الموعد';

  @override
  String get appointmentConfirmed => 'تم تأكيد الموعد';

  @override
  String get goToAppointments => 'الذهاب إلى مواعيدي';

  @override
  String get viewDoctor => 'عرض الطبيب';

  @override
  String get returnHome => 'العودة إلى الرئيسية';

  @override
  String get loadingBooking => 'جارٍ تحميل خيارات الحجز';

  @override
  String get bookingUnavailable => 'الحجز غير متاح';

  @override
  String get timeUnavailable => 'الوقت غير متاح';

  @override
  String get myAppointments => 'مواعيدي';

  @override
  String get upcoming => 'القادمة';

  @override
  String get completed => 'مكتمل';

  @override
  String get cancelled => 'ملغى';

  @override
  String get viewAppointment => 'عرض الموعد';

  @override
  String get rateVisit => 'قيّم الزيارة';

  @override
  String get bookAgain => 'احجز مجددًا';

  @override
  String get actionUnavailable => 'سيصبح هذا الإجراء متاحاً في إصدار قادم.';

  @override
  String get discoverDoctors => 'اكتشف الأطباء';

  @override
  String get firstAppointmentTitle => 'رعايتك تبدأ هنا';

  @override
  String get firstAppointmentBody => 'احجز زيارتك الأولى مع طبيب موثوق.';

  @override
  String get emptyAppointmentsTitle => 'لا يوجد شيء هنا الآن';

  @override
  String get emptyAppointmentsBody => 'ستظهر مواعيد هذه الفئة هنا.';

  @override
  String get appointmentDetails => 'تفاصيل الموعد';

  @override
  String get clinic => 'العيادة';

  @override
  String get date => 'التاريخ';

  @override
  String get time => 'الوقت';

  @override
  String get status => 'الحالة';

  @override
  String get fee => 'الأجرة';

  @override
  String get duration => 'المدة';

  @override
  String get appointmentId => 'رقم الموعد';

  @override
  String get queueOpensAppointmentDay => 'يفتح الطابور في يوم الموعد.';

  @override
  String get queueAvailableToday => 'الطابور المباشر متاح لموعد اليوم.';

  @override
  String get queueNotReady =>
      'دخولك إلى الطابور غير جاهز بعد. سنحدّث الموعد عند توفره.';

  @override
  String get openLiveQueue => 'فتح قائمة الانتظار المباشرة';

  @override
  String get loadingAppointments => 'جارٍ تحميل مواعيدك';

  @override
  String get appointmentsLoadFailed => 'تعذر تحميل مواعيدك.';

  @override
  String consultationMinutes(int minutes) {
    return 'استشارة لمدة $minutes دقيقة';
  }

  @override
  String estimatedWaitMinutes(int minutes) {
    return 'الانتظار المتوقع: $minutes دقيقة';
  }

  @override
  String tabWithCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String minutesLong(int minutes) {
    return '$minutes دقيقة';
  }

  @override
  String iqdAmount(String amount) {
    return '$amount د.ع';
  }

  @override
  String appointmentIdValue(String id) {
    return 'رقم الموعد $id';
  }

  @override
  String get informationalScreen => 'شاشة معلومات';

  @override
  String get welcomeTitle => 'رعاية صحية أكثر وضوحاً';

  @override
  String get welcomeBody =>
      'يجمع ساكسلم الرعاية الموثوقة والمواعيد وتحديثات العيادة المباشرة في تجربة هادئة واحدة.';

  @override
  String get welcomeTrust => 'مصمم للمرضى في كردستان والعراق';

  @override
  String get welcomeBook => 'ابحث عن أطباء موثوقين واحجز معهم';

  @override
  String get welcomeQueue => 'اعرف مكانك في الطابور المباشر';

  @override
  String get welcomeAppointments => 'نظّم رعايتك بسهولة';

  @override
  String get continueAsGuest => 'المتابعة كضيف';

  @override
  String get verifyNumber => 'تحقق من رقمي';

  @override
  String get guestMode => 'وضع الضيف';

  @override
  String get guestModeMessage =>
      'يمكنك استكشاف ساكسلم، لكن الحجز والمواعيد الشخصية تتطلب التحقق.';

  @override
  String get phoneTitle => 'رقم هاتفك';

  @override
  String get phoneBody => 'سنرسل رمزاً لمرة واحدة للتحقق من رقمك بأمان.';

  @override
  String get country => 'الدولة';

  @override
  String get iraq => 'العراق';

  @override
  String get phoneNumber => 'رقم الهاتف';

  @override
  String get phoneHint => '750 123 4567';

  @override
  String get phoneInvalid => 'أدخل رقم هاتف عراقي صحيحًا.';

  @override
  String get sendCode => 'إرسال الرمز';

  @override
  String get otpTitle => 'أدخل رمز التحقق';

  @override
  String otpBody(String phone) {
    return 'أرسلنا رمزاً من 6 أرقام إلى $phone.';
  }

  @override
  String get otpLabel => 'رمز تحقق مكوّن من 6 أرقام';

  @override
  String get otpHint => 'أدخل 6 أرقام';

  @override
  String get verify => 'تحقق وتابع';

  @override
  String get changeNumber => 'تغيير الرقم';

  @override
  String get resendCode => 'إعادة إرسال الرمز';

  @override
  String resendIn(int seconds) {
    return 'إعادة الإرسال خلال $seconds ث';
  }

  @override
  String get otpInvalid => 'الرمز غير صحيح. حاول مرة أخرى.';

  @override
  String get otpExpired => 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.';

  @override
  String get otpLimited => 'محاولات كثيرة. اطلب رمزاً جديداً.';

  @override
  String get authUnavailable =>
      'التحقق عبر الهاتف غير متاح في هذا الإصدار بعد.';

  @override
  String get sessionExpiredTitle => 'انتهت صلاحية جلستك';

  @override
  String get sessionExpiredBody => 'تحقق من رقمك مرة أخرى للمتابعة بأمان.';

  @override
  String developmentCodeHint(String code) {
    return 'رمز التطوير: $code';
  }

  @override
  String get logOut => 'تسجيل الخروج';

  @override
  String get personalizedFeatureTitle => 'التحقق مطلوب';

  @override
  String get personalizedFeatureBody =>
      'سجل الدخول برقم هاتفك لاستخدام المواعيد وميزات الرعاية الشخصية.';

  @override
  String get notifications => 'الإشعارات';

  @override
  String get unread => 'غير مقروء';

  @override
  String get today => 'اليوم';

  @override
  String get earlier => 'سابقًا';

  @override
  String unreadNotifications(int count) {
    return '$count غير مقروء';
  }

  @override
  String notificationUpdates(int count) {
    return '$count تحديثات للطابور';
  }

  @override
  String get notificationDetails => 'تفاصيل الإشعار';

  @override
  String get queueUpdates => 'تحديثات الطابور';

  @override
  String get whatHappened => 'ماذا حدث';

  @override
  String get whyItHappened => 'لماذا';

  @override
  String get whatToDoNext => 'ماذا تفعل الآن';

  @override
  String get viewUpdate => 'عرض التحديث';

  @override
  String get deleteNotification => 'حذف الإشعار';

  @override
  String get notificationsEmpty => 'أنت على اطلاع بكل شيء';

  @override
  String get notificationsEmptyBody =>
      'ستظهر تحديثات المواعيد والعيادة والطابور هنا.';

  @override
  String get notificationsUnavailable => 'الإشعارات غير متاحة';

  @override
  String get notificationsUnavailableBody =>
      'تعذر تحميل تحديثاتك. حاول مرة أخرى.';

  @override
  String get notificationBookingConfirmed => 'تم تأكيد الموعد';

  @override
  String notificationBookingHappened(String doctor) {
    return 'تم تأكيد موعدك مع $doctor.';
  }

  @override
  String get notificationBookingWhy => 'وافقت العيادة على طلب الحجز.';

  @override
  String get notificationBookingNext =>
      'راجع تفاصيل الموعد واحضر في الوقت الموصى به.';

  @override
  String get notificationQueueOpened => 'الطابور متاح الآن';

  @override
  String notificationQueueOpenedHappened(String doctor) {
    return 'الطابور المباشر لـ $doctor متاح الآن.';
  }

  @override
  String get notificationQueueOpenedWhy =>
      'بدأت العيادة طابور المرضى لهذا اليوم.';

  @override
  String get notificationQueueOpenedNext =>
      'افتح الطابور المباشر عندما تكون مستعداً لمتابعة دورك.';

  @override
  String get notificationAlmostTurn => 'دورك اقترب';

  @override
  String notificationAlmostTurnHappened(int number) {
    return 'رقمك الحالي هو $number.';
  }

  @override
  String get notificationAlmostTurnWhy => 'تقدم الطابور وأصبح دورك قريباً.';

  @override
  String get notificationAlmostTurnNext =>
      'يرجى التوجه إلى الاستقبال والبقاء قريباً.';

  @override
  String get notificationWelcome => 'مرحباً بك في ساكسلم';

  @override
  String get notificationWelcomeHappened => 'تجربتك في ساكسلم جاهزة.';

  @override
  String get notificationWelcomeWhy => 'بدأت استخدام ساكسلم على هذا الجهاز.';

  @override
  String get notificationWelcomeNext => 'اكتشف الأطباء الموثوقين ونظم رعايتك.';

  @override
  String get notificationReservedType => 'تحديث الموعد';

  @override
  String get notificationReservedHappened => 'تم تحديث تسجيل وصولك للموعد.';

  @override
  String get notificationReservedWhy => 'سجلت العيادة وصولك.';

  @override
  String get notificationReservedNext => 'يرجى انتظار إرشادات الاستقبال.';

  @override
  String get notificationGeneralHappened => 'هناك تحديث جديد حول رعايتك.';

  @override
  String get notificationGeneralWhy => 'أصبحت معلومات جديدة متاحة.';

  @override
  String get notificationGeneralNext => 'راجع التحديث واتبع التعليمات الظاهرة.';

  @override
  String get notificationTimeJustNow => 'تم التحديث الآن';

  @override
  String notificationTimeMinutesAgo(int minutes) {
    return 'تم التحديث قبل $minutes دقيقة';
  }

  @override
  String get notificationTimeEarlier => 'تم التحديث سابقاً';

  @override
  String get choosePatient => 'اختر المريض';

  @override
  String get bookingFor => 'الحجز لـ';

  @override
  String get addPatient => 'إضافة فرد من العائلة';

  @override
  String get firstName => 'الاسم الأول';

  @override
  String get lastName => 'اسم العائلة';

  @override
  String get relationship => 'صلة القرابة';

  @override
  String get gender => 'الجنس';

  @override
  String get dateOfBirth => 'تاريخ الميلاد';

  @override
  String patientRelationship(String relationship) {
    String _temp0 = intl.Intl.selectLogic(relationship, {
      'mother': 'الأم',
      'father': 'الأب',
      'wife': 'الزوجة',
      'husband': 'الزوج',
      'son': 'الابن',
      'daughter': 'الابنة',
      'brother': 'الأخ',
      'sister': 'الأخت',
      'grandfather': 'الجد',
      'grandmother': 'الجدة',
      'me': 'أنا',
      'other': 'أخرى',
    });
    return '$_temp0';
  }

  @override
  String patientGender(String gender) {
    String _temp0 = intl.Intl.selectLogic(gender, {
      'female': 'أنثى',
      'male': 'ذكر',
      'other': 'غير محدد',
    });
    return '$_temp0';
  }

  @override
  String get loadingPatientAccount => 'جارٍ تحميل حساب المريض';

  @override
  String get profileSetupTitle => 'أخبرنا عن المريض';

  @override
  String get profileSetupBody =>
      'أضف المعلومات الأساسية اللازمة لتخصيص الرعاية.';

  @override
  String get creatingPatientProfile => 'جارٍ إنشاء ملف المريض';

  @override
  String get profileCreationFailed =>
      'تعذر إنشاء ملف المريض. بقيت معلوماتك محفوظة، حاول مرة أخرى.';

  @override
  String get profileSelectionFailed => 'تعذر تبديل المريض. حاول مرة أخرى.';

  @override
  String get patientAccountUnavailable => 'حساب المريض غير متاح مؤقتًا.';

  @override
  String get patientAccountInvalid =>
      'تعذر قراءة حساب المريض بأمان. حاول مرة أخرى.';

  @override
  String get patientAccountOffline =>
      'أنت غير متصل. نعرض آخر معلومات متاحة للمريض.';

  @override
  String get emptyPatientProfiles => 'لا توجد ملفات مرضى بعد.';

  @override
  String get doctorDiscoveryTitle => 'ابحث عن طبيب';

  @override
  String get doctorDiscoveryInstruction =>
      'ابحث عن أطباء موثوقين وحدد النتائج باستخدام المرشحات المتاحة.';

  @override
  String get searchDoctorsLabel => 'البحث عن الأطباء';

  @override
  String get searchDoctorsHint => 'اسم الطبيب';

  @override
  String get clearSearch => 'مسح البحث';

  @override
  String get applyFilters => 'تطبيق عوامل التصفية';

  @override
  String get specialtyLabel => 'التخصص';

  @override
  String get languageLabel => 'اللغة';

  @override
  String get soraniKurdish => 'الكردية السورانية';

  @override
  String get turkish => 'التركية';

  @override
  String get experienceLabel => 'الخبرة';

  @override
  String get minimumExperienceLabel => 'الحد الأدنى للخبرة';

  @override
  String get anyOption => 'الكل';

  @override
  String get appliedFilters => 'المرشحات المطبقة';

  @override
  String doctorResults(int count) {
    return 'عدد الأطباء: $count';
  }

  @override
  String get noDoctorsTitle => 'لم يتم العثور على أطباء';

  @override
  String get noDoctorsBody => 'جرّب اسم طبيب آخر.';

  @override
  String get noDoctorsFilteredBody => 'جرّب إزالة مرشح واحد أو أكثر.';

  @override
  String get loadingDoctors => 'جارٍ تحميل الأطباء';

  @override
  String get loadingMoreDoctors => 'جارٍ تحميل المزيد من الأطباء';

  @override
  String get loadMoreFailed =>
      'تعذر تحميل المزيد من الأطباء. ما زالت النتائج الحالية معروضة.';

  @override
  String get offlineTitle => 'أنت غير متصل';

  @override
  String get offlineBody => 'تحقق من اتصالك وحاول مجدداً.';

  @override
  String get discoveryUnavailableTitle => 'البحث عن الأطباء غير متاح';

  @override
  String get discoveryUnavailableBody =>
      'الخدمة غير متاحة مؤقتاً. حاول مجدداً.';

  @override
  String get discoveryForbiddenTitle => 'البحث عن الأطباء مقيّد';

  @override
  String get discoveryForbiddenBody =>
      'لا يمكن لحسابك الوصول إلى البحث عن الأطباء.';

  @override
  String get malformedDoctorDataTitle => 'معلومات الطبيب غير متاحة';

  @override
  String get malformedDoctorDataBody =>
      'تعذر قراءة معلومات الطبيب بأمان. حاول مجدداً.';

  @override
  String get discoveryErrorTitle => 'حدث خطأ ما';

  @override
  String get discoveryErrorBody => 'يرجى المحاولة مجدداً.';

  @override
  String get discoveryAuthTitle => 'سجّل الدخول للبحث عن الأطباء';

  @override
  String get discoveryAuthBody =>
      'تحقق من رقم هاتفك لتصفح معلومات الأطباء الموثوقة.';

  @override
  String get doctorNotFound => 'لم يتم العثور على الطبيب';

  @override
  String get doctorNotFoundBody => 'ملف هذا الطبيب لم يعد متاحاً.';

  @override
  String yearsExperience(int years) {
    return 'سنوات الخبرة: $years';
  }

  @override
  String get genderFemale => 'أنثى';

  @override
  String get genderMale => 'ذكر';

  @override
  String get genderUnspecified => 'غير محدد';

  @override
  String get languagesLabel => 'اللغات';

  @override
  String get clinicsLabel => 'العيادات';

  @override
  String get specialtiesLabel => 'الاختصاصات';

  @override
  String get biographyLabel => 'نبذة';

  @override
  String get availabilityLabel => 'التوفر';

  @override
  String get doctorAvailable => 'متاح';

  @override
  String get doctorUnavailable => 'غير متاح';

  @override
  String get acceptingNewPatients => 'يستقبل مرضى جدد';

  @override
  String get notAcceptingNewPatients => 'لا يستقبل مرضى جدداً';

  @override
  String profileImageLabel(String name) {
    return 'صورة الملف الشخصي لـ $name';
  }

  @override
  String profileImageFallback(String name) {
    return 'لا توجد صورة ملف شخصي لـ $name';
  }

  @override
  String viewDoctorProfile(String name) {
    return 'عرض ملف $name';
  }

  @override
  String removeAppliedFilter(String label) {
    return 'إزالة مرشح $label';
  }

  @override
  String get bookingComingSoon => 'سيصبح الحجز متاحاً في الإصدار القادم.';

  @override
  String get scheduled => 'مجدول';

  @override
  String get confirmed => 'مؤكد';

  @override
  String get noShow => 'لم يحضر';

  @override
  String get loadMore => 'تحميل المزيد';

  @override
  String get loadingMoreAppointments => 'جارٍ تحميل المزيد من المواعيد';

  @override
  String get appointmentTimeout =>
      'استغرق الطلب وقتاً طويلاً. يرجى المحاولة مجدداً.';

  @override
  String get appointmentForbidden => 'لا يمكن لحسابك الوصول إلى هذا الموعد.';

  @override
  String get appointmentNotFound => 'لم يعد هذا الموعد متاحاً.';

  @override
  String get staleAppointment => 'تم تغيير الموعد. حمّلنا أحدث التفاصيل.';

  @override
  String get appointmentValidation => 'تحقق من المعلومات وحاول مجدداً.';

  @override
  String get appointmentUnknownOutcome =>
      'تعذر تأكيد النتيجة. أعد المحاولة للتحقق من الطلب نفسه بأمان.';

  @override
  String get appointmentsUnavailable => 'المواعيد غير متاحة مؤقتاً.';

  @override
  String get reload => 'إعادة التحميل';

  @override
  String get patient => 'المريض';

  @override
  String get appointmentReference => 'مرجع الموعد';

  @override
  String get cancellationReason => 'سبب الإلغاء';

  @override
  String get cancelAppointment => 'إلغاء الموعد';

  @override
  String get rescheduleAppointment => 'تغيير الموعد';

  @override
  String get chooseNewDateTime => 'اختر تاريخًا ووقتًا جديدين';

  @override
  String get confirmCancellation => 'تأكيد الإلغاء';

  @override
  String get cancel => 'إلغاء';

  @override
  String get recordArrival => 'تسجيل الوصول';

  @override
  String get nextAppointmentTitle => 'موعدك القادم';

  @override
  String patientsAheadCount(int count) {
    return '$count من المرضى قبلك';
  }

  @override
  String estimatedWaitLong(int minutes) {
    return 'وقت الانتظار المتوقع: $minutes دقيقة';
  }

  @override
  String get loadingYourLiveQueue => 'جارٍ تحميل قائمة الانتظار المباشرة';

  @override
  String queueStatusSemantic(String status) {
    return 'حالة قائمة الانتظار: $status';
  }

  @override
  String get queueIsLive => 'قائمة الانتظار مفتوحة';

  @override
  String get queueIsPaused => 'قائمة الانتظار متوقفة مؤقتًا';

  @override
  String get queueIsClosed => 'قائمة الانتظار مغلقة';

  @override
  String get queueConnectedTitle => 'متصل';

  @override
  String get queueConnectedBody => 'قائمة انتظارك مباشرة الآن.';

  @override
  String get queueReconnectingTitle => 'جارٍ إعادة الاتصال';

  @override
  String get queueReconnectingBody => 'نعرض آخر تحديث لقائمة انتظارك.';

  @override
  String get queueDelayedTitle => 'التحديث متأخر';

  @override
  String get queueDelayedBody => 'قد لا تكون هذه المعلومات محدثة.';

  @override
  String get queueOfflineTitle => 'أنت غير متصل';

  @override
  String get queueOfflineBody => 'نعرض آخر تحديث محفوظ على هذا الجهاز.';

  @override
  String get queuePausedTitle => 'قائمة الانتظار متوقفة مؤقتًا';

  @override
  String get queuePausedBody =>
      'مكانك محفوظ. سنحدّثك عند استئناف قائمة الانتظار.';

  @override
  String get queueClosedTitle => 'أُغلقت قائمة الانتظار';

  @override
  String get queueClosedBody => 'للمساعدة بشأن موعدك، يرجى مراجعة الاستقبال.';

  @override
  String get itsYourTurn => 'حان دورك';

  @override
  String get aheadShort => 'قبلك';

  @override
  String get queueStepBooked => 'تم الحجز';

  @override
  String get queueStepArrived => 'وصلت';

  @override
  String get queueStepWaiting => 'الانتظار';

  @override
  String get queueStepYourTurn => 'دورك';

  @override
  String get withDoctorTitle => 'أنت مع الطبيب الآن';

  @override
  String get visitCompleteTitle => 'اكتملت الزيارة';

  @override
  String get calledNoResponseTitle => 'تم النداء على رقمك';

  @override
  String get notCheckedInTitle => 'موعدك اليوم';

  @override
  String get removedFromQueueTitle => 'لم تعد في قائمة الانتظار';

  @override
  String waitRange(int min, int max, String unit) {
    return 'حوالي $min–$max $unit';
  }

  @override
  String get doctorLabel => 'الطبيب';

  @override
  String get familyMembersTitle => 'أفراد العائلة';

  @override
  String get paymentHowToPay => 'كيف تريد الدفع؟';

  @override
  String get paymentAtCounterTitle => 'الدفع في العيادة';

  @override
  String get paymentAtCounterBody => 'ادفع لموظف الاستقبال عند وصولك.';

  @override
  String get paymentOnlineTitle => 'ادفع الآن عبر التطبيق';

  @override
  String get paymentOnlineBody =>
      'ادفع بأمان من تطبيق FIB ولا تنتظر عند الاستقبال.';

  @override
  String get paymentOnlineUnavailable =>
      'هذه العيادة تقبل الدفع في العيادة فقط حالياً.';

  @override
  String get paymentRecommended => 'الأسرع';

  @override
  String get paymentConfirmAndPay => 'تأكيد والدفع';

  @override
  String get paymentTitle => 'الدفع';

  @override
  String get paymentAmountDue => 'المبلغ المطلوب';

  @override
  String get paymentOpenFib => 'افتح FIB للدفع';

  @override
  String get paymentScanQr => 'تدفع من هاتف آخر؟ امسح هذا الرمز.';

  @override
  String get paymentWaiting => 'بانتظار دفعتك…';

  @override
  String get paymentWaitingBody =>
      'وافق على الدفع في FIB ثم عد إلى هنا. تتحدث هذه الشاشة تلقائياً.';

  @override
  String get paymentPaidTitle => 'تم استلام الدفعة';

  @override
  String get paymentPaidBody => 'كل شيء جاهز. لا يوجد ما تدفعه في العيادة.';

  @override
  String get paymentExpiredTitle => 'لم تكتمل هذه الدفعة';

  @override
  String get paymentExpiredBody =>
      'ابدأ دفعة جديدة أو ادفع في العيادة. موعدك ما زال محجوزاً.';

  @override
  String get paymentTryAgain => 'بدء دفعة جديدة';

  @override
  String get paymentSwitchToCounter => 'الدفع في العيادة بدلاً من ذلك';

  @override
  String get paymentLater => 'سأدفع لاحقاً';

  @override
  String get paymentStatusDueAtCounter => 'الدفع في العيادة';

  @override
  String get paymentStatusPending => 'الدفع قيد الانتظار';

  @override
  String get paymentStatusPaid => 'مدفوع';

  @override
  String get paymentStatusRefunded => 'تم الاسترداد';

  @override
  String get paymentStatusRefundPending => 'الاسترداد قيد التنفيذ';

  @override
  String get paymentStatusRefundFailed => 'ستعيد العيادة المبلغ إليك';

  @override
  String get paymentStatusExpired => 'لم يكتمل الدفع';

  @override
  String get paymentStatusVoid => 'لا يوجد ما تدفعه';

  @override
  String get paymentPayNow => 'ادفع الآن';

  @override
  String get paymentProblemOffline =>
      'أنت غير متصل. تحقق من الاتصال وحاول مجدداً.';

  @override
  String get paymentProblemUnavailable =>
      'الدفع عبر التطبيق غير متاح الآن. يمكنك الدفع في العيادة.';

  @override
  String get paymentProblemNotAccepted => 'لا يمكن تغيير هذه الدفعة الآن.';

  @override
  String get paymentProblemGeneric => 'حدث خطأ في الدفع. موعدك ما زال محجوزاً.';

  @override
  String get paymentBookedPayNext => 'تم الحجز! خطوة أخيرة: ادفع ثمن زيارتك.';

  @override
  String get paymentSecureNote =>
      'تدفع داخل تطبيق FIB. لا يرى ساخلم بيانات بطاقتك أو حسابك المصرفي.';

  @override
  String paymentLinkValidUntil(String time) {
    return 'الرابط صالح حتى $time';
  }

  @override
  String get paymentFibNotOpened =>
      'تعذّر فتح FIB. ثبّت تطبيق FIB أو حدّثه، أو امسح رمز QR من هاتف آخر.';

  @override
  String get settingsTitle => 'الإعدادات';

  @override
  String get appLanguage => 'لغة التطبيق';

  @override
  String get deleteAccount => 'حذف الحساب';

  @override
  String get deleteAccountTitle => 'حذف حسابك في ساخلم؟';

  @override
  String get deleteAccountBody =>
      'سيتم تسجيل خروجك من كل الأجهزة وإزالة ملفات عائلتك من التطبيق. تحتفظ العيادات بسجل الزيارات السابقة.';

  @override
  String get deleteAccountConfirm => 'احذف حسابي';

  @override
  String get deleteAccountUpcoming =>
      'ألغِ مواعيدك القادمة أولاً ثم حاول مرة أخرى.';

  @override
  String get deleteAccountFailed =>
      'تعذر حذف حسابك. تحقق من الاتصال وحاول مرة أخرى.';

  @override
  String get cancelAction => 'إلغاء';

  @override
  String get languageSaved => 'تم تغيير اللغة';

  @override
  String get specialtyDentist => 'طب الأسنان';

  @override
  String get specialtyCardiology => 'القلب';

  @override
  String get specialtyPediatrics => 'الأطفال';

  @override
  String get specialtyEye => 'العيون';

  @override
  String get specialtyNeurology => 'الأعصاب';

  @override
  String browseSpecialty(String specialty) {
    return 'تصفح أطباء $specialty';
  }

  @override
  String get nextVisitTitle => 'زيارتك القادمة';

  @override
  String get todayChip => 'اليوم';

  @override
  String get tomorrowChip => 'غداً';

  @override
  String get howItWorks => 'كيف يعمل ساخلم';

  @override
  String get stepBook => 'احجز من التطبيق';

  @override
  String get stepCheckIn => 'سجّل حضورك عند الاستقبال';

  @override
  String get stepCalled => 'يصلك النداء على هاتفك';

  @override
  String get alertsSubtitle => 'نداءات الدور وتحديثات الحجز';

  @override
  String get slotMorning => 'صباحاً';

  @override
  String get slotAfternoon => 'ظهراً';

  @override
  String get slotEvening => 'مساءً';

  @override
  String get ntfBookedTitle => 'تم تأكيد الحجز';

  @override
  String get ntfBookedNext => 'سنذكّرك قبل الموعد بيوم وقبله بقليل.';

  @override
  String get ntfReminderDayTitle => 'موعدك غداً';

  @override
  String get ntfReminderSoonTitle => 'موعدك قريب';

  @override
  String get ntfReminderNext =>
      'سجّل وصولك عند الاستقبال. إذا لم تستطع الحضور، ألغِ الموعد من المواعيد ليستفيد منه غيرك.';

  @override
  String get ntfCancelledTitle => 'ألغت العيادة موعدك';

  @override
  String get ntfCancelledNext => 'احجز وقتاً آخر مع الطبيب نفسه أو طبيب آخر.';

  @override
  String get ntfRescheduledTitle => 'تم تغيير موعدك';

  @override
  String get ntfRescheduledNext =>
      'إذا لم يناسبك الوقت الجديد، غيّره أو ألغه من المواعيد.';

  @override
  String get ntfAlmostTitle => 'اقترب دورك';

  @override
  String get ntfNextTitle => 'أنت التالي';

  @override
  String get ntfAlmostNext => 'توجّه إلى صالة الانتظار وابقَ قريباً.';

  @override
  String get ntfQueueOpenedTitle => 'بدأ الطابور';

  @override
  String get ntfFollowQueue => 'تابع دورك في الطابور المباشر.';

  @override
  String get ntfPausedTitle => 'توقف الطابور مؤقتاً';

  @override
  String get ntfPausedNext => 'مكانك محفوظ. سنخبرك عندما يتحرك مجدداً.';

  @override
  String get ntfResumedTitle => 'عاد الطابور للحركة';

  @override
  String get ntfClosedTitle => 'أُغلق الطابور';

  @override
  String get ntfClosedNext => 'إذا لم يتم فحصك، اسأل استقبال العيادة.';

  @override
  String get ntfEnqueuedTitle => 'أنت في الطابور';

  @override
  String get ntfCalledTitle => 'حان دورك';

  @override
  String get ntfCalledNext => 'تفضّل بالدخول إلى الطبيب الآن.';

  @override
  String get ntfMissedTitle => 'فاتك دورك';

  @override
  String get ntfMissedNext => 'تحدّث مع الاستقبال، يمكنهم إعادتك إلى الطابور.';

  @override
  String get ntfStartedTitle => 'بدأت معاينتك';

  @override
  String get ntfCompletedTitle => 'انتهت زيارتك';

  @override
  String get ntfCompletedNext =>
      'نتمنى لك الشفاء. تحتاج مراجعة؟ احجزها من صفحة الطبيب.';

  @override
  String get ntfWhyAppointment => 'بخصوص موعد حجزته في ساخلم.';

  @override
  String get ntfWhyQueue => 'من الطابور المباشر في العيادة.';

  @override
  String ntfAtClinic(String doctor, String clinic) {
    return '$doctor في $clinic';
  }

  @override
  String ntfTicket(int number) {
    return 'رقم $number';
  }

  @override
  String ntfAhead(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخص قبلك',
      many: '$count شخصاً قبلك',
      few: '$count أشخاص قبلك',
      two: 'شخصان قبلك',
      one: 'شخص واحد قبلك',
      zero: 'لا أحد قبلك',
    );
    return '$_temp0';
  }

  @override
  String ntfDoctorStarted(String doctor) {
    return 'بدأ $doctor باستقبال المرضى.';
  }

  @override
  String ntfDoctorPaused(String doctor) {
    return 'أوقف $doctor الطابور لفترة قصيرة.';
  }

  @override
  String ntfDoctorResumed(String doctor) {
    return 'عاد $doctor لاستقبال المرضى.';
  }

  @override
  String ntfDoctorFinished(String doctor) {
    return 'أنهى $doctor عمله لهذا اليوم.';
  }

  @override
  String ntfCompletedHappened(String doctor) {
    return 'اكتملت زيارتك عند $doctor.';
  }

  @override
  String get feeFirstVisit => 'الزيارة الأولى';

  @override
  String get feeFollowUp => 'المراجعة';

  @override
  String get feesTitle => 'الأجور';

  @override
  String get feesNote => 'ادفع في العيادة، أو داخل التطبيق عبر FIB عند الحجز.';

  @override
  String get nextFreeLabel => 'أقرب وقت متاح';

  @override
  String yearsShort(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count سنة',
      many: '$count سنة',
      few: '$count سنوات',
      two: 'سنتان',
      one: 'سنة واحدة',
    );
    return '$_temp0';
  }

  @override
  String get directions => 'الاتجاهات';

  @override
  String get callClinic => 'اتصال';

  @override
  String get clinicLocationMissing => 'لم تُضف العيادة عنوانها بعد.';

  @override
  String get openMapsFailed => 'تعذّر فتح الخرائط على هذا الهاتف.';

  @override
  String get bookAgainTitle => 'احجز مجدداً';

  @override
  String bookAgainAction(String doctor) {
    return 'احجز مجدداً عند $doctor';
  }

  @override
  String get familyTileTitle => 'العائلة';

  @override
  String get familyTileSubtitle => 'احجز لأطفالك ووالديك';

  @override
  String get addToCalendar => 'أضف إلى التقويم';

  @override
  String visitWith(String doctor) {
    return 'موعد عند $doctor';
  }

  @override
  String get freeTodayFilter => 'متاح اليوم';

  @override
  String get noneFreeToday =>
      'لا يوجد وقت متاح اليوم عند هؤلاء الأطباء. ألغِ \"متاح اليوم\" لرؤية أيام أخرى.';

  @override
  String get helpTitle => 'المساعدة والدعم';

  @override
  String get contactSaxlem => 'راسل ساخلم عبر واتساب';

  @override
  String get termsOfUse => 'شروط الاستخدام';

  @override
  String get privacyPolicy => 'سياسة الخصوصية';

  @override
  String appVersion(String version) {
    return 'الإصدار $version';
  }

  @override
  String get whatsBothering => 'مما تشكو؟';

  @override
  String get symptomFever => 'حمى أو زكام';

  @override
  String get symptomChild => 'طفلي مريض';

  @override
  String get symptomTooth => 'ألم الأسنان';

  @override
  String get symptomSkin => 'الجلد';

  @override
  String get symptomHeart => 'القلب والضغط';

  @override
  String get symptomEyes => 'العيون';

  @override
  String get symptomPregnancy => 'الحمل وصحة المرأة';

  @override
  String get symptomBones => 'العظام والمفاصل';

  @override
  String get symptomEar => 'الأذن والأنف والحنجرة';

  @override
  String get symptomHead => 'الصداع والأعصاب';

  @override
  String get symptomStomach => 'المعدة';

  @override
  String get specialtiesTitle => 'التخصصات';

  @override
  String get emergencyTitle => 'طوارئ';

  @override
  String get emergencySubtitle => 'الإسعاف: 122';

  @override
  String get emergencyConfirmTitle => 'الاتصال بـ 122 الآن؟';

  @override
  String get emergencyConfirmBody =>
      'ساخلم لحجز المواعيد وليس للطوارئ. إذا احتاج أحد مساعدة عاجلة، اتصل بالإسعاف.';

  @override
  String get emergencyCall => 'اتصل بـ 122';

  @override
  String get liveNotOpen => 'لم يبدأ الطابور بعد';

  @override
  String get liveCheckIn => 'الطابور مفتوح · سجّل وصولك عند الاستقبال';

  @override
  String get liveWithDoctor => 'أنت عند الطبيب الآن';

  @override
  String liveWait(int min, int max) {
    return 'حوالي $min–$max دقيقة';
  }

  @override
  String leaveByTime(String time) {
    return 'انطلق قبل $time';
  }

  @override
  String get leaveNow => 'انطلق الآن';

  @override
  String leaveInMinutes(int minutes) {
    return 'انطلق خلال $minutes د';
  }

  @override
  String get leaveLate => 'قد تتأخر. انطلق الآن';

  @override
  String leaveDrive(int minutes, String distance) {
    return '$minutes د بالسيارة · $distance';
  }

  @override
  String leaveKm(String km) {
    return '$km كم';
  }

  @override
  String leaveMeters(String meters) {
    return '$meters م';
  }

  @override
  String get leaveWithTraffic => 'مع حركة المرور';

  @override
  String get leaveNoTraffic => 'دون حساب الازدحام';

  @override
  String get leaveEstimate => 'تقدير حسب المسافة';

  @override
  String get leaveApproximate => 'موقع تقريبي';

  @override
  String leaveArriveBy(String time) {
    return 'كن عند الاستقبال قبل $time لتسجيل الوصول';
  }

  @override
  String get leaveAskTitle => 'متى أنطلق؟';

  @override
  String get leaveAskBody =>
      'يمكن لساخلم استخدام موقعك لحساب مدة القيادة إلى العيادة مع حركة المرور، وإخبارك متى تنطلق.';

  @override
  String get leaveAskPrivacy => 'يُستخدم موقعك لهذا فقط ولا يُحفظ أبدًا.';

  @override
  String get leaveAskButton => 'استخدم موقعي';

  @override
  String get leaveWorking => 'جارٍ حساب الطريق…';

  @override
  String get leaveServiceOff => 'شغّل الموقع لمعرفة وقت الانطلاق.';

  @override
  String get leaveDeniedForever =>
      'اسمح لساخلم باستخدام الموقع من الإعدادات لمعرفة وقت الانطلاق.';

  @override
  String get leaveTurnOn => 'تشغيل الموقع';

  @override
  String get leaveOpenSettings => 'فتح الإعدادات';

  @override
  String get leaveFailed => 'تعذّر حساب الطريق الآن.';

  @override
  String get leaveStop => 'أوقف استخدام موقعي';

  @override
  String get leaveAlertChannel => 'وقت الانطلاق';

  @override
  String get leaveAlertTitle => 'حان وقت الاستعداد لموعدك';

  @override
  String leaveAlertBody(String leave, String doctor, String time, int minutes) {
    return 'انطلق قبل $leave لموعدك عند $doctor الساعة $time · $minutes د بالسيارة';
  }

  @override
  String minutesShortDrive(int minutes) {
    return '$minutes د بالسيارة';
  }

  @override
  String get leaveOnMyWay => 'أنا في الطريق';

  @override
  String get leaveOnMyWayNote =>
      'يُعلم العيادة بموعد وصولك. لا تتم مشاركة موقعك.';

  @override
  String get leaveOnMyWayFailed => 'تعذّر إبلاغ العيادة. حاول مجددًا.';

  @override
  String get leaveOnTheWayTitle => 'أنت في الطريق';

  @override
  String leaveExpectedAt(String time) {
    return 'تتوقع العيادة وصولك نحو الساعة $time';
  }

  @override
  String get leaveReceptionSees => 'يرى الاستقبال أنك قادم.';

  @override
  String leaveExpectedShort(String time) {
    return 'في الطريق · متوقع $time';
  }

  @override
  String get leaveLearned => 'مع الازدحام المعتاد في هذه الساعة';

  @override
  String starsLabel(String rating) {
    return '$rating من 5 نجوم';
  }

  @override
  String reviewCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تقييمات',
      one: 'تقييم واحد',
    );
    return '$_temp0';
  }

  @override
  String get reviewsTitle => 'التقييمات';

  @override
  String get reviewsNone =>
      'لا توجد تقييمات بعد. يمكن فقط للمرضى الذين زاروا الطبيب التقييم.';

  @override
  String reviewsSeeAll(int count) {
    return 'عرض كل التقييمات ($count)';
  }

  @override
  String get reviewsMore => 'عرض المزيد';

  @override
  String reviewsOf(String doctor) {
    return 'تقييمات $doctor';
  }

  @override
  String get reviewAnonymous => 'مريض في ساخلم';

  @override
  String get reviewVerified => 'زيارة مؤكدة';

  @override
  String get rateTitle => 'كيف كانت زيارتك؟';

  @override
  String rateWith(String doctor) {
    return 'قيّم زيارتك عند $doctor';
  }

  @override
  String get rateCommentHint =>
      'هل هناك ما يجب أن يعرفه المرضى الآخرون؟ (اختياري)';

  @override
  String get rateCommentRule =>
      'يظهر للجميع. بدون روابط أو بريد إلكتروني أو أرقام هواتف.';

  @override
  String get rateAnonymous => 'انشر بدون اسمي';

  @override
  String get ratePost => 'نشر التقييم';

  @override
  String get rateUpdate => 'تحديث التقييم';

  @override
  String get rateEdit => 'تغيير';

  @override
  String get rateThanks => 'شكرًا. تقييمك يساعد المرضى الآخرين على الاختيار.';

  @override
  String get rateRemoved => 'أزال ساخلم هذا التقييم.';

  @override
  String get rateFailed => 'تعذّر نشر تقييمك. حاول مجددًا.';

  @override
  String rateEditUntil(String date) {
    return 'يمكنك تغييره حتى $date.';
  }

  @override
  String get ntfReviewTitle => 'كيف كانت زيارتك؟';

  @override
  String get ntfReviewNext =>
      'قيّمها في ثوانٍ. هذا يساعد المرضى الآخرين على الاختيار.';
}
