/// Where a clinic is and how to reach it. Any field may be missing.
class ClinicLocation {
  const ClinicLocation({
    required this.id,
    required this.name,
    this.address,
    this.area,
    this.city,
    this.latitude,
    this.longitude,
    this.phoneNumber,
  });
  final String id, name;
  final String? address, area, city, phoneNumber;
  final double? latitude, longitude;

  bool get hasPin => latitude != null && longitude != null;
  bool get canNavigate => hasPin || (address?.isNotEmpty ?? false);

  /// "Kurdistan St, near the Grand Bazaar · Nakhoshkhana, Duhok".
  String get line => [
    address,
    [area, city].whereType<String>().join(', '),
  ].whereType<String>().where((part) => part.isNotEmpty).join(' · ');

  /// Opens turn-by-turn directions in Google Maps (app or browser).
  Uri get directions => Uri.https('www.google.com', '/maps/dir/', {
    'api': '1',
    'destination': hasPin
        ? '$latitude,$longitude'
        : [name, line].where((part) => part.isNotEmpty).join(', '),
  });

  Uri? get call =>
      phoneNumber == null ? null : Uri(scheme: 'tel', path: phoneNumber);
}

/// Repositories that can say where a clinic is.
abstract interface class ClinicLocationSource {
  Future<ClinicLocation> clinicLocation(String clinicId);
}
