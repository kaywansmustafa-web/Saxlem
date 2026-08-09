import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'production booking composition cannot reach mock clinical booking data',
    () {
      final dependencies = File(
        'lib/app/app_dependencies.dart',
      ).readAsStringSync();
      final feature = File(
        'lib/features/booking/booking_feature.dart',
      ).readAsStringSync();
      expect(dependencies, contains('BackendBookingRepository'));
      expect(dependencies, isNot(contains('MockBookingDataSource')));
      expect(feature, isNot(contains('MockBookingDataSource')));
      expect(feature, isNot(contains('InMemoryPatientAppointmentsRepository')));
    },
  );

  test('production appointment composition cannot reach in-memory data', () {
    final dependencies = File(
      'lib/app/app_dependencies.dart',
    ).readAsStringSync();
    final feature = File(
      'lib/features/appointments/appointments_feature.dart',
    ).readAsStringSync();
    expect(dependencies, contains('BackendPatientAppointmentsRepository'));
    expect(
      dependencies,
      isNot(contains('InMemoryPatientAppointmentsRepository')),
    );
    expect(feature, isNot(contains('InMemoryPatientAppointmentsRepository')));
  });

  test(
    'authoritative booking widgets contain no fabricated slot fee or policy',
    () {
      final production = [
        File(
          'lib/features/booking/data/repositories/backend_booking_repository.dart',
        ),
        File(
          'lib/features/booking/presentation/controllers/booking_controller.dart',
        ),
        ...Directory(
          'lib/features/booking/presentation/pages',
        ).listSync().whereType<File>(),
      ].map((file) => file.readAsStringSync()).join('\n');
      expect(production, isNot(contains('mockAppointmentId')));
      expect(production, isNot(contains('cancellationPolicy')));
      expect(production, isNot(contains(r'quote-${')));
      expect(production, isNot(contains('SlotGenerationService(')));
    },
  );
}
