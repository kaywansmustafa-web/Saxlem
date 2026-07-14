class DoctorReference {
  const DoctorReference({
    required this.id,
    required this.displayName,
    required this.specialtyDisplayName,
    this.photoUrl,
  });

  final String id;
  final String displayName;
  final String specialtyDisplayName;
  final String? photoUrl;
}
