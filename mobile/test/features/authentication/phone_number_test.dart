import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/authentication/domain/entities/phone_number.dart';

void main() {
  test('normalizes Iraqi mobile numbers to E.164', () {
    expect(PhoneNumber.parseIraq('0750 123 4567')?.e164, '+9647501234567');
    expect(PhoneNumber.parseIraq('+964 750 123 4567')?.e164, '+9647501234567');
  });

  test('rejects invalid Iraqi numbers', () {
    expect(PhoneNumber.parseIraq('12345'), isNull);
    expect(PhoneNumber.parseIraq('0660 123 4567'), isNull);
  });
}
