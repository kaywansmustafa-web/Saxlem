import 'dart:math';

abstract interface class BookingOperationIdGenerator {
  String generate();
}

class SecureBookingOperationIdGenerator implements BookingOperationIdGenerator {
  SecureBookingOperationIdGenerator({Random? random})
    : _random = random ?? Random.secure();

  final Random _random;

  @override
  String generate() {
    final bytes = List<int>.generate(24, (_) => _random.nextInt(256));
    final encoded = bytes
        .map((value) => value.toRadixString(16).padLeft(2, '0'))
        .join();
    return 'booking-$encoded';
  }
}
