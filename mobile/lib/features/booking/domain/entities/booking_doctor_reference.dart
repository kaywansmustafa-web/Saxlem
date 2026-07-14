class BookingDoctorReference {
  const BookingDoctorReference({
    required this.id,
    required this.displayName,
    required this.specialtyDisplayName,
    this.photoUrl,
  });
  final String id, displayName, specialtyDisplayName;
  final String? photoUrl;
}
