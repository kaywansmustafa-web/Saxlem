import '../../domain/entities/otp_challenge.dart';

enum AuthStep { welcome, phone, otp }

class AuthState {
  const AuthState({
    this.step = AuthStep.welcome,
    this.challenge,
    this.phoneInput = '',
    this.code = '',
    this.loading = false,
    this.errorCode,
  });

  final AuthStep step;
  final OtpChallenge? challenge;
  final String phoneInput, code;
  final bool loading;
  final String? errorCode;

  AuthState copyWith({
    AuthStep? step,
    OtpChallenge? challenge,
    String? phoneInput,
    String? code,
    bool? loading,
    String? errorCode,
    bool clearError = false,
  }) => AuthState(
    step: step ?? this.step,
    challenge: challenge ?? this.challenge,
    phoneInput: phoneInput ?? this.phoneInput,
    code: code ?? this.code,
    loading: loading ?? this.loading,
    errorCode: clearError ? null : errorCode ?? this.errorCode,
  );
}
