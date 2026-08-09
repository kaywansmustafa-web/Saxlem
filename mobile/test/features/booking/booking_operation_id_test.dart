import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/booking/domain/services/booking_operation_id.dart';

void main() {
  test(
    'creates strong printable operation identifiers within backend bounds',
    () {
      final generator = SecureBookingOperationIdGenerator();
      final first = generator.generate();
      final second = generator.generate();
      expect(first, matches(RegExp(r'^booking-[0-9a-f]{48}$')));
      expect(first.length, inInclusiveRange(8, 128));
      expect(second, isNot(first));
    },
  );
}
