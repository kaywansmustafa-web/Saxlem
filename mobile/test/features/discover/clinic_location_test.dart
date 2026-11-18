import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/discover/data/dto/backend_doctor_discovery_dto.dart';
import 'package:saxlem_app/features/discover/domain/entities/clinic_location.dart';

void main() {
  const parser = BackendDoctorDiscoveryParser();
  Map<String, dynamic> json() => {
    'id': '00000000-0000-4000-8000-000000000010',
    'name': 'Riverside Clinic',
    'address': 'Kurdistan St, near the Grand Bazaar',
    'area': 'Nakhoshkhana',
    'city': 'Duhok',
    'latitude': 36.8669,
    'longitude': 42.9886,
    'phoneNumber': '07501234567',
  };

  test('reads a clinic location and builds Directions and Call', () {
    final location = parser.clinicLocation(json());
    expect(
      location.line,
      'Kurdistan St, near the Grand Bazaar · Nakhoshkhana, Duhok',
    );
    expect(
      location.directions.toString(),
      'https://www.google.com/maps/dir/?api=1&destination=36.8669%2C42.9886',
    );
    expect(location.call.toString(), 'tel:07501234567');
  });

  test('a clinic with only an address still gets directions, by name', () {
    final location = parser.clinicLocation(
      json()
        ..['latitude'] = null
        ..['longitude'] = null
        ..['phoneNumber'] = null,
    );
    expect(location.hasPin, isFalse);
    expect(location.canNavigate, isTrue);
    expect(location.call, isNull);
    expect(
      location.directions.queryParameters['destination'],
      startsWith('Riverside Clinic, Kurdistan St'),
    );
  });

  test('rejects half a pin, a bad phone and unknown fields', () {
    for (final bad in [
      json()..['longitude'] = null,
      json()..['phoneNumber'] = 'call us',
      json()..['owner'] = 'x',
    ]) {
      expect(() => parser.clinicLocation(bad), throwsA(anything));
    }
    expect(const ClinicLocation(id: 'x', name: 'Clinic').canNavigate, isFalse);
  });
}
