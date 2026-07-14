enum MedicalSpecialty {
  dentistry,
  cardiology,
  pediatrics,
  ophthalmology,
  neurology,
  dermatology,
  orthopedics,
  internalMedicine,
  gynecology,
  ent,
}

enum DoctorGender { female, male }

enum SpokenLanguage { badiniKurdish, soraniKurdish, arabic, english, turkish }

enum DiscoverySort {
  recommended,
  earliestAvailability,
  shortestWait,
  nearest,
  lowestFee,
  highestRating,
}

enum AvailabilityStatus { availableNow, availableToday, tomorrow, fullyBooked }

enum DiscoverConnectionStatus { connected, stale, offline }
