import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_result.dart';
import 'package:saxlem_app/features/reviews/domain/review.dart';
import 'package:saxlem_app/features/saved_doctors/domain/saved_doctors.dart';
import 'package:saxlem_app/features/saved_doctors/presentation/save_doctor_button.dart';
import 'package:saxlem_app/features/saved_doctors/presentation/saved_doctors.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

const _shilan = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

DoctorDiscoveryResult _doctor(String id, String name) => DoctorDiscoveryResult(
  doctorId: id,
  doctorDisplayName: name,
  fullName: name,
  primarySpecialtyDisplayName: 'Cardiology',
  gender: BackendDoctorGender.female,
  status: BackendDoctorStatus.active,
  yearsOfExperience: 12,
  languages: const ['ku'],
  clinics: const [DoctorClinicReference(id: 'c1', name: 'Hillview')],
  availability: const DoctorAvailabilityFoundation(
    status: DoctorAvailabilityStatus.available,
    acceptingNewPatients: true,
    nextAvailableAt: null,
    updatedAt: null,
  ),
  rating: const DoctorRating(average: 4.8, count: 23),
);

class _Saved implements SavedDoctorsSource {
  final _ids = ValueNotifier<Set<String>?>(null);
  final saved = <String, DoctorDiscoveryResult>{};
  bool fail = false;
  @override
  ValueListenable<Set<String>?> get savedIds => _ids;
  @override
  Future<List<DoctorDiscoveryResult>> savedDoctors() async {
    _ids.value = saved.keys.toSet();
    return saved.values.toList();
  }

  @override
  Future<void> setSaved(String doctorId, {required bool saved}) async {
    final before = _ids.value ?? {};
    if (fail) throw const SavedDoctorsFailure();
    if (saved) {
      this.saved[doctorId] = _doctor(doctorId, 'Dr. Shilan');
      _ids.value = {...before, doctorId};
    } else {
      _ids.value = {...before}..remove(doctorId);
      this.saved.remove(doctorId);
    }
  }
}

Widget _app(Widget child) => MaterialApp(
  theme: AppTheme.light,
  supportedLocales: AppLocalizations.supportedLocales,
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  home: Scaffold(body: child),
);

void main() {
  testWidgets('the heart saves and un-saves a doctor', (tester) async {
    final source = _Saved();
    await tester.pumpWidget(
      _app(
        SaveDoctorButton(
          doctorId: _shilan,
          doctorName: 'Dr. Shilan',
          source: source,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Save Dr. Shilan'));
    await tester.pumpAndSettle();
    expect(source.saved.keys, [_shilan]);
    expect(find.text('Saved'), findsOneWidget);
    await tester.tap(find.byTooltip('Remove Dr. Shilan from saved'));
    await tester.pumpAndSettle();
    expect(source.saved, isEmpty);

    source.fail = true;
    await tester.tap(find.byTooltip('Save Dr. Shilan'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Save Dr. Shilan'), findsOneWidget);
    expect(
      find.text("Couldn't update saved doctors. Try again."),
      findsOneWidget,
    );
  });

  testWidgets('Home shows saved doctors and follows changes', (tester) async {
    final source = _Saved()..saved[_shilan] = _doctor(_shilan, 'Dr. Shilan');
    String? opened;
    await tester.pumpWidget(
      _app(
        SavedDoctorsStrip(source: source, onOpenDoctor: (id) => opened = id),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Saved doctors'), findsOneWidget);
    expect(find.text('4.8'), findsOneWidget);
    await tester.tap(find.text('Dr. Shilan'));
    expect(opened, _shilan);
    await source.setSaved(_shilan, saved: false);
    await tester.pumpAndSettle();
    expect(find.text('Saved doctors'), findsNothing);
  });
}
