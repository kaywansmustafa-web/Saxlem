class DiscoveryLocation {
  const DiscoveryLocation({
    required this.cityId,
    required this.cityDisplayName,
    required this.areaId,
    required this.areaDisplayName,
    required this.distanceMeters,
  });
  final String cityId;
  final String cityDisplayName;
  final String areaId;
  final String areaDisplayName;
  final int distanceMeters;
}
