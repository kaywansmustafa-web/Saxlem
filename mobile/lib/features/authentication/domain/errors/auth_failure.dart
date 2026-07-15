class AuthFailure implements Exception {
  const AuthFailure(this.code);

  final String code;
}
