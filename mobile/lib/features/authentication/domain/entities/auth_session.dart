enum AuthSessionStatus { initializing, guest, authenticated, sessionExpired }

class AuthSession {
  const AuthSession._({required this.status, this.userId, this.phoneNumber});

  const AuthSession.initializing()
    : this._(status: AuthSessionStatus.initializing);
  const AuthSession.guest() : this._(status: AuthSessionStatus.guest);
  const AuthSession.authenticated({
    required String userId,
    required String phoneNumber,
  }) : this._(
         status: AuthSessionStatus.authenticated,
         userId: userId,
         phoneNumber: phoneNumber,
       );
  const AuthSession.sessionExpired()
    : this._(status: AuthSessionStatus.sessionExpired);

  final AuthSessionStatus status;
  final String? userId;
  final String? phoneNumber;
}
