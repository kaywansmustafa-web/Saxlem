enum PatientProfilesFailureType {
  unauthenticated,
  sessionExpired,
  offline,
  timeout,
  rateLimited,
  conflict,
  forbidden,
  unavailable,
  malformed,
  validation,
  unknown,
}

class PatientProfilesFailure implements Exception {
  const PatientProfilesFailure(this.type);

  final PatientProfilesFailureType type;

  bool get isTransient =>
      type == PatientProfilesFailureType.offline ||
      type == PatientProfilesFailureType.timeout ||
      type == PatientProfilesFailureType.rateLimited ||
      type == PatientProfilesFailureType.unavailable;

  bool get isTerminalAuthentication =>
      type == PatientProfilesFailureType.unauthenticated ||
      type == PatientProfilesFailureType.sessionExpired;

  @override
  String toString() => 'PatientProfilesFailure(${type.name})';
}
