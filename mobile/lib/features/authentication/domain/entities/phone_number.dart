import 'country_calling_code.dart';

class PhoneNumber {
  const PhoneNumber({
    required this.countryCode,
    required this.callingCode,
    required this.nationalNumber,
  });

  final String countryCode;
  final String callingCode;
  final String nationalNumber;

  String get e164 => '$callingCode$nationalNumber';
  String get masked =>
      '$callingCode ••• ••• ${nationalNumber.substring(nationalNumber.length - 3)}';

  static PhoneNumber? parseIraq(String input) {
    return parse(
      input,
      const CountryCallingCode(isoCode: 'IQ', callingCode: '+964'),
    );
  }

  static PhoneNumber? parse(String input, CountryCallingCode country) {
    var digits = input.replaceAll(RegExp(r'\D'), '');
    final callingDigits = country.callingCode.substring(1);
    if (digits.startsWith(callingDigits)) {
      digits = digits.substring(callingDigits.length);
    }
    if (digits.startsWith('0')) digits = digits.substring(1);
    final valid = country.isoCode == 'IQ'
        ? digits.length == 10 && digits.startsWith('7')
        : digits.length >= 7 && digits.length <= 12;
    if (!valid) return null;
    return PhoneNumber(
      countryCode: country.isoCode,
      callingCode: country.callingCode,
      nationalNumber: digits,
    );
  }
}
