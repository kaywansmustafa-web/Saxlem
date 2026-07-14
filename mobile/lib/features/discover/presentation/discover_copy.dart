import '../domain/entities/discovery_types.dart';

class DiscoverCopy {
  const DiscoverCopy();
  String specialty(MedicalSpecialty v) => switch (v) {
    MedicalSpecialty.internalMedicine => 'Internal Medicine',
    MedicalSpecialty.ent => 'Ear, Nose & Throat',
    _ => '${v.name[0].toUpperCase()}${v.name.substring(1)}',
  };
  String availability(AvailabilityStatus v) => switch (v) {
    AvailabilityStatus.availableNow => 'Available Now',
    AvailabilityStatus.availableToday => 'Available Today',
    AvailabilityStatus.tomorrow => 'Tomorrow',
    AvailabilityStatus.fullyBooked => 'Fully Booked',
  };
  String language(SpokenLanguage v) => switch (v) {
    SpokenLanguage.badiniKurdish => 'Badini Kurdish',
    SpokenLanguage.soraniKurdish => 'Sorani Kurdish',
    _ => '${v.name[0].toUpperCase()}${v.name.substring(1)}',
  };
  String fee(int value) {
    final s = value.toString();
    final out = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) out.write(',');
      out.write(s[i]);
    }
    return '$out IQD';
  }
}
