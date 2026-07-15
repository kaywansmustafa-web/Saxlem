class OtpChallenge {
  const OtpChallenge({
    required this.id,
    required this.maskedDestination,
    required this.expiresAt,
    required this.resendAvailableAt,
  });

  final String id;
  final String maskedDestination;
  final DateTime expiresAt;
  final DateTime resendAvailableAt;
}
