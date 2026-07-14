import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_ku.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('ku'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Saxlem'**
  String get appName;

  /// No description provided for @chooseLanguage.
  ///
  /// In en, this message translates to:
  /// **'Choose your language'**
  String get chooseLanguage;

  /// No description provided for @languageCanChange.
  ///
  /// In en, this message translates to:
  /// **'You can change this later in your profile.'**
  String get languageCanChange;

  /// No description provided for @badiniKurdish.
  ///
  /// In en, this message translates to:
  /// **'Badini Kurdish'**
  String get badiniKurdish;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @savingLanguage.
  ///
  /// In en, this message translates to:
  /// **'Saving language'**
  String get savingLanguage;

  /// No description provided for @languageSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t save your language. Please try again.'**
  String get languageSaveFailed;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @discover.
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get discover;

  /// No description provided for @appointments.
  ///
  /// In en, this message translates to:
  /// **'Appointments'**
  String get appointments;

  /// No description provided for @alerts.
  ///
  /// In en, this message translates to:
  /// **'Alerts'**
  String get alerts;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @alertsTitle.
  ///
  /// In en, this message translates to:
  /// **'Alerts are coming soon'**
  String get alertsTitle;

  /// No description provided for @alertsBody.
  ///
  /// In en, this message translates to:
  /// **'Important appointment and clinic updates will appear here in a future release.'**
  String get alertsBody;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Your profile is coming soon'**
  String get profileTitle;

  /// No description provided for @profileBody.
  ///
  /// In en, this message translates to:
  /// **'You\'ll be able to manage your details, language, and care preferences here.'**
  String get profileBody;

  /// No description provided for @goodMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning,'**
  String get goodMorning;

  /// No description provided for @goodAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon,'**
  String get goodAfternoon;

  /// No description provided for @goodEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening,'**
  String get goodEvening;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search doctors, clinics or specialties'**
  String get searchHint;

  /// No description provided for @openHealthcareSearch.
  ///
  /// In en, this message translates to:
  /// **'Open healthcare search'**
  String get openHealthcareSearch;

  /// No description provided for @openSearchFilters.
  ///
  /// In en, this message translates to:
  /// **'Open search filters'**
  String get openSearchFilters;

  /// No description provided for @liveQueue.
  ///
  /// In en, this message translates to:
  /// **'Live queue'**
  String get liveQueue;

  /// No description provided for @live.
  ///
  /// In en, this message translates to:
  /// **'LIVE'**
  String get live;

  /// No description provided for @currentPatient.
  ///
  /// In en, this message translates to:
  /// **'Current patient'**
  String get currentPatient;

  /// No description provided for @yourNumber.
  ///
  /// In en, this message translates to:
  /// **'Your Number'**
  String get yourNumber;

  /// No description provided for @patientsAhead.
  ///
  /// In en, this message translates to:
  /// **'Patients ahead'**
  String get patientsAhead;

  /// No description provided for @estimatedWait.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait'**
  String get estimatedWait;

  /// No description provided for @doctorStatus.
  ///
  /// In en, this message translates to:
  /// **'Doctor status'**
  String get doctorStatus;

  /// No description provided for @minutesShort.
  ///
  /// In en, this message translates to:
  /// **'min'**
  String get minutesShort;

  /// No description provided for @viewLiveQueue.
  ///
  /// In en, this message translates to:
  /// **'View live queue'**
  String get viewLiveQueue;

  /// No description provided for @popularSpecialties.
  ///
  /// In en, this message translates to:
  /// **'Popular specialties'**
  String get popularSpecialties;

  /// No description provided for @recommendedDoctors.
  ///
  /// In en, this message translates to:
  /// **'Recommended doctors'**
  String get recommendedDoctors;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @book.
  ///
  /// In en, this message translates to:
  /// **'Book'**
  String get book;

  /// No description provided for @filters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filters;

  /// No description provided for @sortResults.
  ///
  /// In en, this message translates to:
  /// **'Sort results'**
  String get sortResults;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get tryAgain;

  /// No description provided for @clearFilters.
  ///
  /// In en, this message translates to:
  /// **'Clear filters'**
  String get clearFilters;

  /// No description provided for @findRightCare.
  ///
  /// In en, this message translates to:
  /// **'Find the right care'**
  String get findRightCare;

  /// No description provided for @findRightCareBody.
  ///
  /// In en, this message translates to:
  /// **'Search in everyday words. We\'ll help you find doctors who may be able to help.'**
  String get findRightCareBody;

  /// No description provided for @quickCategories.
  ///
  /// In en, this message translates to:
  /// **'Quick categories'**
  String get quickCategories;

  /// No description provided for @doctorProfile.
  ///
  /// In en, this message translates to:
  /// **'Doctor Profile'**
  String get doctorProfile;

  /// No description provided for @viewProfile.
  ///
  /// In en, this message translates to:
  /// **'View profile'**
  String get viewProfile;

  /// No description provided for @addToMyDoctors.
  ///
  /// In en, this message translates to:
  /// **'Add to My Doctors'**
  String get addToMyDoctors;

  /// No description provided for @removeFromMyDoctors.
  ///
  /// In en, this message translates to:
  /// **'Remove from My Doctors'**
  String get removeFromMyDoctors;

  /// No description provided for @bookAppointment.
  ///
  /// In en, this message translates to:
  /// **'Book appointment'**
  String get bookAppointment;

  /// No description provided for @chooseAppointment.
  ///
  /// In en, this message translates to:
  /// **'Choose an appointment'**
  String get chooseAppointment;

  /// No description provided for @chooseClinic.
  ///
  /// In en, this message translates to:
  /// **'Choose a clinic'**
  String get chooseClinic;

  /// No description provided for @chooseDate.
  ///
  /// In en, this message translates to:
  /// **'Choose a date'**
  String get chooseDate;

  /// No description provided for @chooseTime.
  ///
  /// In en, this message translates to:
  /// **'Choose a time'**
  String get chooseTime;

  /// No description provided for @reviewAppointment.
  ///
  /// In en, this message translates to:
  /// **'Review appointment'**
  String get reviewAppointment;

  /// No description provided for @confirmAppointment.
  ///
  /// In en, this message translates to:
  /// **'Confirm appointment'**
  String get confirmAppointment;

  /// No description provided for @confirmingAppointment.
  ///
  /// In en, this message translates to:
  /// **'Confirming appointment'**
  String get confirmingAppointment;

  /// No description provided for @appointmentConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Appointment confirmed'**
  String get appointmentConfirmed;

  /// No description provided for @goToAppointments.
  ///
  /// In en, this message translates to:
  /// **'Go to My Appointments'**
  String get goToAppointments;

  /// No description provided for @viewDoctor.
  ///
  /// In en, this message translates to:
  /// **'View Doctor'**
  String get viewDoctor;

  /// No description provided for @returnHome.
  ///
  /// In en, this message translates to:
  /// **'Return Home'**
  String get returnHome;

  /// No description provided for @loadingBooking.
  ///
  /// In en, this message translates to:
  /// **'Loading booking options'**
  String get loadingBooking;

  /// No description provided for @bookingUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Booking unavailable'**
  String get bookingUnavailable;

  /// No description provided for @timeUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Time unavailable'**
  String get timeUnavailable;

  /// No description provided for @myAppointments.
  ///
  /// In en, this message translates to:
  /// **'My Appointments'**
  String get myAppointments;

  /// No description provided for @upcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get upcoming;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @cancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelled;

  /// No description provided for @viewAppointment.
  ///
  /// In en, this message translates to:
  /// **'View Appointment'**
  String get viewAppointment;

  /// No description provided for @rateVisit.
  ///
  /// In en, this message translates to:
  /// **'Rate Visit'**
  String get rateVisit;

  /// No description provided for @bookAgain.
  ///
  /// In en, this message translates to:
  /// **'Book Again'**
  String get bookAgain;

  /// No description provided for @actionUnavailable.
  ///
  /// In en, this message translates to:
  /// **'This action will be available in a future release.'**
  String get actionUnavailable;

  /// No description provided for @discoverDoctors.
  ///
  /// In en, this message translates to:
  /// **'Discover Doctors'**
  String get discoverDoctors;

  /// No description provided for @firstAppointmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Your care starts here'**
  String get firstAppointmentTitle;

  /// No description provided for @firstAppointmentBody.
  ///
  /// In en, this message translates to:
  /// **'Book your first visit with a trusted doctor.'**
  String get firstAppointmentBody;

  /// No description provided for @emptyAppointmentsTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing here right now'**
  String get emptyAppointmentsTitle;

  /// No description provided for @emptyAppointmentsBody.
  ///
  /// In en, this message translates to:
  /// **'Your appointments in this category will appear here.'**
  String get emptyAppointmentsBody;

  /// No description provided for @appointmentDetails.
  ///
  /// In en, this message translates to:
  /// **'Appointment Details'**
  String get appointmentDetails;

  /// No description provided for @clinic.
  ///
  /// In en, this message translates to:
  /// **'Clinic'**
  String get clinic;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @time.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get time;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @fee.
  ///
  /// In en, this message translates to:
  /// **'Fee'**
  String get fee;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get duration;

  /// No description provided for @appointmentId.
  ///
  /// In en, this message translates to:
  /// **'Appointment ID'**
  String get appointmentId;

  /// No description provided for @queueOpensAppointmentDay.
  ///
  /// In en, this message translates to:
  /// **'Queue opens on appointment day.'**
  String get queueOpensAppointmentDay;

  /// No description provided for @queueAvailableToday.
  ///
  /// In en, this message translates to:
  /// **'Live Queue is available for today\'s appointment.'**
  String get queueAvailableToday;

  /// No description provided for @queueNotReady.
  ///
  /// In en, this message translates to:
  /// **'Your queue entry is not ready yet. We\'ll update this appointment when it becomes available.'**
  String get queueNotReady;

  /// No description provided for @openLiveQueue.
  ///
  /// In en, this message translates to:
  /// **'Open Live Queue'**
  String get openLiveQueue;

  /// No description provided for @loadingAppointments.
  ///
  /// In en, this message translates to:
  /// **'Loading your appointments'**
  String get loadingAppointments;

  /// No description provided for @appointmentsLoadFailed.
  ///
  /// In en, this message translates to:
  /// **'We could not load your appointments.'**
  String get appointmentsLoadFailed;

  /// No description provided for @consultationMinutes.
  ///
  /// In en, this message translates to:
  /// **'{minutes} min consultation'**
  String consultationMinutes(int minutes);

  /// No description provided for @estimatedWaitMinutes.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait: {minutes} min'**
  String estimatedWaitMinutes(int minutes);

  /// No description provided for @tabWithCount.
  ///
  /// In en, this message translates to:
  /// **'{label} ({count})'**
  String tabWithCount(String label, int count);

  /// No description provided for @minutesLong.
  ///
  /// In en, this message translates to:
  /// **'{minutes} minutes'**
  String minutesLong(int minutes);

  /// No description provided for @iqdAmount.
  ///
  /// In en, this message translates to:
  /// **'{amount} IQD'**
  String iqdAmount(int amount);

  /// No description provided for @appointmentIdValue.
  ///
  /// In en, this message translates to:
  /// **'Appointment ID {id}'**
  String appointmentIdValue(String id);

  /// No description provided for @informationalScreen.
  ///
  /// In en, this message translates to:
  /// **'Informational screen'**
  String get informationalScreen;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'ku'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'ku':
      return AppLocalizationsKu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
