// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kurdish (`ku`).
class AppLocalizationsKu extends AppLocalizations {
  AppLocalizationsKu([String locale = 'ku']) : super(locale);

  @override
  String get appName => 'ساخله‌م';

  @override
  String get chooseLanguage => 'زمانێ خۆ هەلبژێرە';

  @override
  String get languageCanChange => 'دێ شێی پاشتر ل پروفایلێ خۆ بگوهۆڕی.';

  @override
  String get badiniKurdish => 'کوردی بادینی';

  @override
  String get english => 'ئینگلیزی';

  @override
  String get arabic => 'عەرەبی';

  @override
  String get continueLabel => 'بەردەوام بە';

  @override
  String get savingLanguage => 'زمان دهێتە پاراستن';

  @override
  String get languageSaveFailed =>
      'پاراستنا زمانێ نەشیا. هیڤیە جارەکا دی هەول بدە.';

  @override
  String get home => 'سەرەکی';

  @override
  String get discover => 'گەڕان';

  @override
  String get appointments => 'ژڤان';

  @override
  String get alerts => 'ئاگەهداری';

  @override
  String get profile => 'پروفایل';

  @override
  String get alertsTitle => 'ئاگەهداری دێ بزوی بهێن';

  @override
  String get alertsBody =>
      'نویکرنێن گرنگ یێن ژڤان و کلینیکان دێ ل ڤێرێ دیار بن.';

  @override
  String get profileTitle => 'پروفایلا تە دێ بزوی بهێت';

  @override
  String get profileBody =>
      'دێ شێی زانیاری، زمان و هەلبژاردنێن چاڤدێریا خۆ رێک بخەی.';

  @override
  String get goodMorning => 'ڕۆژباش،';

  @override
  String get goodAfternoon => 'ڕۆژباش،';

  @override
  String get goodEvening => 'ئێڤارباش،';

  @override
  String get searchHint => 'ل نوژدار، کلینیک یان پسپۆڕی بگەڕێ';

  @override
  String get openHealthcareSearch => 'گەڕیانا تەندروستی ڤەکە';

  @override
  String get openSearchFilters => 'فلتەرێن گەڕیانێ ڤەکە';

  @override
  String get liveQueue => 'رێزبەندییا زندی';

  @override
  String get live => 'ڕاستەوخۆ';

  @override
  String get currentPatient => 'نەخوشێ نوکە';

  @override
  String get yourNumber => 'ژمارا تە';

  @override
  String get patientsAhead => 'نەخوشێن بەری تە';

  @override
  String get estimatedWait => 'پێشىینییا چاڤەرێکرنێ';

  @override
  String get doctorStatus => 'بارێ نوژداری';

  @override
  String get minutesShort => 'خولەک';

  @override
  String get viewLiveQueue => 'رێزبەندییا زندی ببینە';

  @override
  String get popularSpecialties => 'پسپۆڕیێن بەناڤودەنگ';

  @override
  String get recommendedDoctors => 'نوژدارێن پێشنیارکری';

  @override
  String get seeAll => 'هەمیێ ببینە';

  @override
  String get book => 'حجز بکە';

  @override
  String get filters => 'فلتەر';

  @override
  String get sortResults => 'ئەنجامان رێک بخە';

  @override
  String get tryAgain => 'دووبارە هەول بدە';

  @override
  String get clearFilters => 'فلتەران پاک بکە';

  @override
  String get findRightCare => 'چاڤدێریا گونجای بدۆزەڤە';

  @override
  String get findRightCareBody =>
      'ب پەیڤێن سادە بگەڕێ، ئەم دێ هاریکاریا تە کەین نوژدارێ گونجای بدۆزی.';

  @override
  String get quickCategories => 'پۆلێن خێرا';

  @override
  String get doctorProfile => 'پروفایلا نوژداری';

  @override
  String get viewProfile => 'پروفایلێ ببینە';

  @override
  String get addToMyDoctors => 'زێدە بکە بۆ نوژدارێن من';

  @override
  String get removeFromMyDoctors => 'ژ نوژدارێن من ڕاکە';

  @override
  String get bookAppointment => 'ژڤانەکی داخواز بکە';

  @override
  String get chooseAppointment => 'ژڤانیەکێ هەلبژێرە';

  @override
  String get chooseClinic => 'کلینیکێ هەلبژێرە';

  @override
  String get chooseDate => 'رۆژێ هەلبژێرە';

  @override
  String get chooseTime => 'دەمێ هەلبژێرە';

  @override
  String get appointmentType => 'Appointment type';

  @override
  String get initialAppointment => 'Initial appointment';

  @override
  String get followUpAppointment => 'Follow-up appointment';

  @override
  String get appointmentReason => 'Reason for visit';

  @override
  String get checkAvailability => 'Check availability';

  @override
  String get noAvailableSlots => 'No available times in this date range.';

  @override
  String get timezone => 'Time zone';

  @override
  String get bookingTimeout =>
      'The availability request timed out. Please try again.';

  @override
  String get slotTaken =>
      'That time is no longer available. Check availability again.';

  @override
  String get bookingValidationFailure =>
      'Check your booking details and try again.';

  @override
  String get bookingUnknownOutcome =>
      'We could not confirm the result. Do not submit another booking until you retry this request.';

  @override
  String get bookingSuccessful => 'Your appointment is booked.';

  @override
  String appointmentReferenceValue(String reference) {
    return 'Appointment reference $reference';
  }

  @override
  String get reviewAppointment => 'ژڤانیێ پێداچوون بکە';

  @override
  String get confirmAppointment => 'ژڤانیێ پشتڕاست بکە';

  @override
  String get confirmingAppointment => 'ژڤان دهێتە پشتڕاستکرن';

  @override
  String get appointmentConfirmed => 'ژڤان هاتە پشتڕاستکرن';

  @override
  String get goToAppointments => 'ژڤانێن من';

  @override
  String get viewDoctor => 'نوژداری ببینە';

  @override
  String get returnHome => 'بزڤرە سەرەکی';

  @override
  String get loadingBooking => 'هەلبژاردنێن ژڤانیێ دهێنە بارکرن';

  @override
  String get bookingUnavailable => 'ژڤان وەرگرتن نە بەردەستە';

  @override
  String get timeUnavailable => 'دەم نە بەردەستە';

  @override
  String get myAppointments => 'ژڤانێن من';

  @override
  String get upcoming => 'داهاتی';

  @override
  String get completed => 'تەمامبووی';

  @override
  String get cancelled => 'هەلوەشای';

  @override
  String get viewAppointment => 'ژڤانیێ ببینە';

  @override
  String get rateVisit => 'سەردانێ هەلسەنگینە';

  @override
  String get bookAgain => 'دیسە ژڤان بگرە';

  @override
  String get actionUnavailable => 'ڤی کار دێ ل وەشانەکا داهاتی بەردەست بیت.';

  @override
  String get discoverDoctors => 'نوژداران بدۆزەڤە';

  @override
  String get firstAppointmentTitle => 'چاڤدێریا تە ل ڤێرێ دەست پێ دکەت';

  @override
  String get firstAppointmentBody =>
      'سەردانا خۆ یا ئێکێ ل گەل نوژدارەکێ باوەرپێکری بگرە.';

  @override
  String get emptyAppointmentsTitle => 'نوکە تشتەک ل ڤێرێ نینە';

  @override
  String get emptyAppointmentsBody => 'ژڤانیێن ڤێ پۆلێ دێ ل ڤێرێ دیار بن.';

  @override
  String get appointmentDetails => 'زانیاری یێن ژڤانێ تە';

  @override
  String get clinic => 'کلینیک';

  @override
  String get date => 'رێکەفت';

  @override
  String get time => 'دەمژمێر';

  @override
  String get status => 'بار';

  @override
  String get fee => 'بها';

  @override
  String get duration => 'دەم';

  @override
  String get appointmentId => 'ناسناما ژڤانیێ';

  @override
  String get queueOpensAppointmentDay => 'ڕیز ل رۆژا ژڤانیێ ڤەدبیت.';

  @override
  String get queueAvailableToday => 'رێزبەندییا زندی بۆ ژڤانیا ئەڤرۆ بەردەستە.';

  @override
  String get queueNotReady =>
      'دەرکەفتنا تە یا ڕیزێ هێشتا ئامادە نینە. دێ ژڤانیێ نویکەین دەمێ بەردەست بوو.';

  @override
  String get openLiveQueue => 'رێزبەندییا زندی ڤەکە';

  @override
  String get loadingAppointments => 'ژڤانیێن تە دهێنە بارکرن';

  @override
  String get appointmentsLoadFailed => 'بارکرنا ژڤانیێن تە نەشیا.';

  @override
  String consultationMinutes(int minutes) {
    return 'راوێژ بۆ $minutes خولەکان';
  }

  @override
  String estimatedWaitMinutes(int minutes) {
    return 'چاڤەڕێکرنا پێشبینیکری: $minutes خولەک';
  }

  @override
  String tabWithCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String minutesLong(int minutes) {
    return '$minutes خولەک';
  }

  @override
  String iqdAmount(int amount) {
    return '$amount د.ع';
  }

  @override
  String appointmentIdValue(String id) {
    return 'ناسناما ژڤانیێ $id';
  }

  @override
  String get informationalScreen => 'پەڕا زانیاریێ';

  @override
  String get welcomeTitle => 'ساخله‌می، ڕوونتر';

  @override
  String get welcomeBody =>
      'ساخله‌م چاڤدێرییا باوەرپێکری، وەعدە و نویکرنێن زیندی یێن کلینیکێ د ئەزموونەکا ئارام دا دکەتە ئێک.';

  @override
  String get welcomeTrust => 'بۆ نەخۆشێن کوردستان و عیراقێ هاتیە چێکرن';

  @override
  String get welcomeBook => 'نوژدارێن باوەرپێکری ببینە و وەعدە بگرە';

  @override
  String get welcomeQueue => 'جهێ خۆ د ڕیزا زیندی دا بزانە';

  @override
  String get welcomeAppointments => 'چاڤدێرییا خۆ ڕێک و پێک بکە';

  @override
  String get continueAsGuest => 'وەک مێهڤان بەردەوام بە';

  @override
  String get verifyNumber => 'ژمارا مۆبایلا خو پشتراست بکە';

  @override
  String get guestMode => 'دوخێ مێهڤانان';

  @override
  String get guestModeMessage =>
      'تو دشێی ساخله‌مێ بگەڕی، لێ وەعدە و تایبەتمەندیێن کەسی پشتڕاستکرنێ دخوازن.';

  @override
  String get phoneTitle => 'ژمارا مۆبایلا تە';

  @override
  String get phoneBody =>
      'ئەم دێ کودەکا ئێکجارێ فرێکەین دا ژمارا تە ب پارێزراوی پشتڕاست بکەین.';

  @override
  String get country => 'وەلات';

  @override
  String get iraq => 'عیراق';

  @override
  String get phoneNumber => 'ژمارا مۆبایلێ';

  @override
  String get phoneHint => '750 123 4567';

  @override
  String get phoneInvalid => 'ژمارەکا موبایلا عیراقی یا دروست بنڤیسە.';

  @override
  String get sendCode => 'کودی ڤرێکە';

  @override
  String get otpTitle => 'کودی پڕ بکە';

  @override
  String otpBody(String phone) {
    return 'ڤرێکر$phone مە کودەکێ  ٦ ژمارەیی بۆ';
  }

  @override
  String get otpLabel => 'کودا پشتراستکرنێ یا ٦ ژمارەیی';

  @override
  String get otpHint => '٦ ژمارەیان پڕ بکە';

  @override
  String get verify => 'پشتراست بکە و بەردەوام بە';

  @override
  String get changeNumber => 'ژمارێ بگۆڕە';

  @override
  String get resendCode => 'کودی دیسان ڤڕیکە';

  @override
  String resendIn(int seconds) {
    return 'چرکەیان دیسان دێ هنێرین $seconds پشتی';
  }

  @override
  String get otpInvalid => 'ئەڤ کودە راست نینە. تکایە دیسان هەوڵ بدە.';

  @override
  String get otpExpired =>
      'ئەڤ کودە ماوەیا وێ دەرباس بوو. کودەکێ نوی داخواز بکە.';

  @override
  String get otpLimited => 'هەوڵدان زۆر بوون. تکایە کودەکێ نوی داخواز بکە.';

  @override
  String get authUnavailable =>
      'پشتراستکرنا ژمارا مۆبایلێ هێشتا ل ڤێ وەشانێ بەردەست نینە.';

  @override
  String get sessionExpiredTitle => 'دانیشتنا تە دەرچووە';

  @override
  String get sessionExpiredBody =>
      'بۆ بەردەوامبوونێ ژمارا خۆ دیسان پشتراست بکە.';

  @override
  String developmentCodeHint(String code) {
    return 'کودا پەرەپێدانێ: $code';
  }

  @override
  String get logOut => 'دەرکەڤە';

  @override
  String get personalizedFeatureTitle => 'پشتراستکرن پێویستە';

  @override
  String get personalizedFeatureBody =>
      'ب ژمارا خۆ بچە ژوور بۆ بکارئینانا وەعدە و تایبەتمەندیێن چاڤدێرییا کەسی.';

  @override
  String get notifications => 'ئاگەهداری';

  @override
  String get unread => 'نە ڤەکری';

  @override
  String get today => 'ئەڤرو';

  @override
  String get earlier => 'بەری نوکە';

  @override
  String unreadNotifications(int count) {
    return '$count نەهاتینە خواندن';
  }

  @override
  String notificationUpdates(int count) {
    return '$count نووکرنێن ریزێ';
  }

  @override
  String get notificationDetails => 'وردەکاریێن ئاگەهداریێ';

  @override
  String get queueUpdates => 'نووکرنێن ریزێ';

  @override
  String get whatHappened => 'چی روویدا';

  @override
  String get whyItHappened => 'بۆچی';

  @override
  String get whatToDoNext => 'پاشی چی بکەی';

  @override
  String get viewUpdate => 'نووکرنێ ببینە';

  @override
  String get deleteNotification => 'ئاگەهداریێ ژێ ببە';

  @override
  String get notificationsEmpty => 'هەمی تشتەک دروستە';

  @override
  String get notificationsEmptyBody =>
      'نووکرنێن وەعدە، کلینیک و ریزێ ل ڤێرێ دێ دیار بن.';

  @override
  String get notificationsUnavailable => 'ئاگەهداری بەردەست نینن';

  @override
  String get notificationsUnavailableBody =>
      'مە نەشیا نووکرنێن تە بار بکەین. دیسان تاقی بکە.';

  @override
  String get notificationBookingConfirmed => 'وەعدە هاتە پشتڕاستکرن';

  @override
  String notificationBookingHappened(String doctor) {
    return 'وەعدەیا تە ل گەل $doctor هاتە پشتڕاستکرن.';
  }

  @override
  String get notificationBookingWhy => 'کلینیکێ داخوازا وەعدەیا تە قەبویل کر.';

  @override
  String get notificationBookingNext =>
      'وردەکاریێن وەعدەیێ ببینە و د دەمێ پێشنیارکری دا بەرهەڤ بە.';

  @override
  String get notificationQueueOpened => 'ریزا تە ڤەبوو';

  @override
  String notificationQueueOpenedHappened(String doctor) {
    return 'ریزا زیندی یا $doctor نوکە بەردەستە.';
  }

  @override
  String get notificationQueueOpenedWhy =>
      'کلینیکێ ریزا نەخۆشان یا ئیرۆ دەستپێکر.';

  @override
  String get notificationQueueOpenedNext =>
      'دەمێ بەرهەڤ بی ریزا زیندی ڤەکە و جهێ خۆ ببینە.';

  @override
  String get notificationAlmostTurn => 'نۆرا تە نێزیکە';

  @override
  String notificationAlmostTurnHappened(int number) {
    return 'ژمارا تە یا نوکە $number ـە.';
  }

  @override
  String get notificationAlmostTurnWhy => 'ریز پێشڤەچوو و نۆرا تە نێزیک بوو.';

  @override
  String get notificationAlmostTurnNext =>
      'هیڤییە بچە پێشوازیێ و ل نێزیک بمینە.';

  @override
  String get notificationWelcome => 'بخێر بهێی بو ساخلەم';

  @override
  String get notificationWelcomeHappened => 'ئەزموونا تە یا ساخله‌مێ بەرهەڤە.';

  @override
  String get notificationWelcomeWhy =>
      'تە ل سەر ڤێ ئامیرێ دەست ب بکارئینانا ساخله‌مێ کر.';

  @override
  String get notificationWelcomeNext =>
      'نوژدارێن باوەرپێکری ببینە و چاڤدێرییا خۆ رێک بخە.';

  @override
  String get notificationReservedType => 'نووکرنا وەعدەیێ';

  @override
  String get notificationReservedHappened => 'تۆمارکرنا هاتنا تە هاتە نووکرن.';

  @override
  String get notificationReservedWhy => 'کلینیکێ هاتنا تە تۆمار کر.';

  @override
  String get notificationReservedNext =>
      'هیڤییە چاڤەرێی رێنماییێن پێشوازیێ بە.';

  @override
  String get notificationGeneralHappened =>
      'نووکرنەکا نوو دەربارەی چاڤدێرییا تە هەیە.';

  @override
  String get notificationGeneralWhy => 'زانیاریێن نوو بەردەست بوون.';

  @override
  String get notificationGeneralNext => 'نووکرنێ ببینە و رێنماییێن دیار بکە.';

  @override
  String get notificationTimeJustNow => 'نوکە هاتە نووکرن';

  @override
  String notificationTimeMinutesAgo(int minutes) {
    return 'بەری $minutes خولەکان هاتە نووکرن';
  }

  @override
  String get notificationTimeEarlier => 'بەری نوکە هاتە نووکرن';

  @override
  String get choosePatient => 'نەخوشی ب هەلبژێرە';

  @override
  String get bookingFor => 'حجز ژ بوی';

  @override
  String get addPatient => 'ئەندامێ خێزانێ زێدە بکە';

  @override
  String get firstName => 'ناڤێ ئێکێ';

  @override
  String get lastName => 'ناڤێ دووماهیێ';

  @override
  String get relationship => 'پەیوەندی';

  @override
  String get gender => 'رەگەز';

  @override
  String get dateOfBirth => 'رێکەفتا ژدایکبوونێ';

  @override
  String patientRelationship(String relationship) {
    String _temp0 = intl.Intl.selectLogic(relationship, {
      'mother': 'یێن دی',
      'father': 'باب',
      'wife': 'هەڤژین',
      'husband': 'هەڤژین',
      'son': 'کور',
      'daughter': 'کچ',
      'brother': 'یێن دی',
      'sister': 'خویشک',
      'grandfather': 'باپیر',
      'grandmother': 'یێن دی',
      'me': 'ئەز',
      'other': 'یێن دی',
    });
    return '$_temp0';
  }

  @override
  String patientGender(String gender) {
    String _temp0 = intl.Intl.selectLogic(gender, {
      'female': 'نێر',
      'male': 'نێر',
      'other': 'دیار نینە',
    });
    return '$_temp0';
  }

  @override
  String get loadingPatientAccount => 'هەژمارێ نەخۆشی دهێتە بارکرن';

  @override
  String get profileSetupTitle => 'دەربارەی نەخۆشی بێژە مە';

  @override
  String get profileSetupBody =>
      'زانیاریێن پێویست بۆ چاڤدێریا تایبەت تۆمار بکە.';

  @override
  String get creatingPatientProfile => 'پڕۆفایلێ نەخۆشی دهێتە دروستکرن';

  @override
  String get profileCreationFailed =>
      'پڕۆفایل نەهاتە دروستکرن. زانیاریێن تە پاراستینە، دیسان هەوڵ بدە.';

  @override
  String get profileSelectionFailed =>
      'گوهۆڕینا نەخۆشی سەرنەکەفت. دیسان هەوڵ بدە.';

  @override
  String get patientAccountUnavailable => 'هەژمارێ نەخۆشی نوکە بەردەست نینە.';

  @override
  String get patientAccountInvalid =>
      'مە نەشیا هەژمارێ نەخۆشی ب پارێزراوی بخوینین. دیسان هەوڵ بدە.';

  @override
  String get patientAccountOffline =>
      'تو ئۆفلاینی. زانیاریێن دوماهیێ یێن نەخۆشی نیشان ددەین.';

  @override
  String get emptyPatientProfiles => 'هێشتا چ پڕۆفایلێن نەخۆشان نینن.';

  @override
  String get doctorDiscoveryTitle => 'نوژداران بدۆزەڤە';

  @override
  String get doctorDiscoveryInstruction =>
      'ل نوژدارێن باوەرپێکری بگەڕە و ئەنجامان ب فلتەرێن بەردەست کورت بکە.';

  @override
  String get searchDoctorsLabel => 'ل نوژداران بگەڕە';

  @override
  String get searchDoctorsHint => 'ناڤێ نوژداری';

  @override
  String get clearSearch => 'گەڕیانێ پاک بکە';

  @override
  String get applyFilters => 'فلتەران جێبەجێ بکە';

  @override
  String get specialtyLabel => 'پسپۆڕی';

  @override
  String get languageLabel => 'زمان';

  @override
  String get soraniKurdish => 'کوردی سۆرانی';

  @override
  String get turkish => 'تورکی';

  @override
  String get experienceLabel => 'ئەزموون';

  @override
  String get minimumExperienceLabel => 'کێمترین ئەزموون';

  @override
  String get anyOption => 'هەمی';

  @override
  String get appliedFilters => 'فلتەرێن جێبەجێکری';

  @override
  String doctorResults(int count) {
    return '$count نوژدار';
  }

  @override
  String get noDoctorsTitle => 'چ نوژدار نەهاتنە دیتن';

  @override
  String get noDoctorsBody => 'ناڤێ نوژدارەکێ دی تاقی بکە.';

  @override
  String get noDoctorsFilteredBody => 'فلتەرەک یان ژ پتر پاک بکە.';

  @override
  String get loadingDoctors => 'نوژدار دهێنە بارکرن';

  @override
  String get loadingMoreDoctors => 'نوژدارێن پتر دهێنە بارکرن';

  @override
  String get loadMoreFailed =>
      'بارکرنا نوژدارێن پتر سەرنەکەفت. ئەنجامێن نوکە هێشتا دیارن.';

  @override
  String get offlineTitle => 'تو ئۆفلاینی';

  @override
  String get offlineBody => 'پەیوەندییا خۆ بپشکنە و دیسان هەول بدە.';

  @override
  String get discoveryUnavailableTitle => 'گەڕیان ل نوژداران بەردەست نینە';

  @override
  String get discoveryUnavailableBody =>
      'خزمەتگوزاری نوکە بەردەست نینە. دیسان هەول بدە.';

  @override
  String get discoveryForbiddenTitle => 'گەڕیان ل نوژداران سنووردارە';

  @override
  String get discoveryForbiddenBody => 'هەژمارا تە ناتوانیت دەست بگەهینیت.';

  @override
  String get malformedDoctorDataTitle => 'زانیاریێن نوژداری بەردەست نینن';

  @override
  String get malformedDoctorDataBody =>
      'مە نەشیا زانیاریێن نوژداری ب پارێزراوی بخوینین. دیسان هەول بدە.';

  @override
  String get discoveryErrorTitle => 'تشتەک خەلەت چوو';

  @override
  String get discoveryErrorBody => 'دیسان هەول بدە.';

  @override
  String get discoveryAuthTitle => 'بچۆ ژوور بۆ دیتنا نوژداران';

  @override
  String get discoveryAuthBody =>
      'ژمارا موبایلا خۆ پشتڕاست بکە بۆ دیتنا زانیاریێن نوژداران.';

  @override
  String get doctorNotFound => 'نوژدار نەهاتە دیتن';

  @override
  String get doctorNotFoundBody => 'پڕۆفایلا ڤی نوژداری ئێدی بەردەست نینە.';

  @override
  String yearsExperience(int years) {
    return '$years سال ئەزموون';
  }

  @override
  String get genderFemale => 'مێ';

  @override
  String get genderMale => 'نێر';

  @override
  String get genderUnspecified => 'دیار نەکری';

  @override
  String get languagesLabel => 'زمان';

  @override
  String get clinicsLabel => 'کلینیک';

  @override
  String get specialtiesLabel => 'پسپۆڕی';

  @override
  String get biographyLabel => 'دەربارە';

  @override
  String get availabilityLabel => 'بەردەستبوون';

  @override
  String get doctorAvailable => 'بەردەستە';

  @override
  String get doctorUnavailable => 'بەردەست نینە';

  @override
  String get acceptingNewPatients => 'نەخۆشێن نوی وەردگریت';

  @override
  String get notAcceptingNewPatients => 'نەخۆشێن نوی وەرناگریت';

  @override
  String profileImageLabel(String name) {
    return 'وێنێ پڕۆفایلا $name';
  }

  @override
  String profileImageFallback(String name) {
    return 'وێنێ پڕۆفایلا $name نینە';
  }

  @override
  String viewDoctorProfile(String name) {
    return 'پڕۆفایلا $name ببینە';
  }

  @override
  String removeAppliedFilter(String label) {
    return 'فلتەرا $label پاک بکە';
  }

  @override
  String get bookingComingSoon => 'حجزکرن د وەشانێ داهاتی دا بەردەست دبیت.';
}
