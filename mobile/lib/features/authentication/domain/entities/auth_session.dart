enum AuthSessionStatus {
  initializing,
  guest,
  authenticated,
  sessionExpired,
  restorationUnavailable,
  malformedLocalSession,
}

class AuthSession {
  const AuthSession._({required this.status, this.userId, this.phoneNumber});

  const AuthSession.initializing()
    : this._(status: AuthSessionStatus.initializing);
  const AuthSession.guest() : this._(status: AuthSessionStatus.guest);
  const AuthSession.authenticated({String? userId, required String phoneNumber})
    : this._(
        status: AuthSessionStatus.authenticated,
        userId: userId,
        phoneNumber: phoneNumber,
      );
  const AuthSession.sessionExpired()
    : this._(status: AuthSessionStatus.sessionExpired);
  const AuthSession.restorationUnavailable()
    : this._(status: AuthSessionStatus.restorationUnavailable);
  const AuthSession.malformedLocalSession()
    : this._(status: AuthSessionStatus.malformedLocalSession);

  final AuthSessionStatus status;
  final String? userId;
  final String? phoneNumber;
}
