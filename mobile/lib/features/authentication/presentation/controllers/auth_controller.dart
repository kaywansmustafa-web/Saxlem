import 'package:flutter/foundation.dart';

import '../../domain/entities/auth_session.dart';
import '../../domain/entities/country_calling_code.dart';
import '../../domain/entities/phone_number.dart';
import '../../domain/errors/auth_failure.dart';
import '../../domain/repositories/auth_repository.dart';
import '../state/auth_state.dart';

class AuthController extends ChangeNotifier {
  AuthController(
    this._repository, {
    required this.onAuthenticated,
    required this.onGuest,
  });
  final AuthRepository _repository;
  final ValueChanged<AuthSession> onAuthenticated;
  final VoidCallback onGuest;

  AuthState state = const AuthState();
  CountryCallingCode country = supportedCallingCodes.first;

  void selectCountry(CountryCallingCode value) {
    country = value;
    state = state.copyWith(clearError: true);
    notifyListeners();
  }

  void showPhone() {
    state = state.copyWith(step: AuthStep.phone, clearError: true);
    notifyListeners();
  }

  void showWelcome() {
    state = const AuthState();
    notifyListeners();
  }

  void changePhone() {
    state = AuthState(step: AuthStep.phone, phoneInput: state.phoneInput);
    notifyListeners();
  }

  void updatePhone(String value) {
    state = state.copyWith(phoneInput: value, clearError: true);
    notifyListeners();
  }

  void updateCode(String value) {
    state = state.copyWith(
      code: value
          .replaceAll(RegExp(r'\D'), '')
          .substring(0, value.replaceAll(RegExp(r'\D'), '').length.clamp(0, 6)),
      clearError: true,
    );
    notifyListeners();
  }

  Future<void> requestOtp() async {
    final phone = PhoneNumber.parse(state.phoneInput, country);
    if (phone == null) {
      state = state.copyWith(errorCode: 'phone');
      notifyListeners();
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    notifyListeners();
    try {
      final challenge = await _repository.requestOtp(phone);
      state = AuthState(
        step: AuthStep.otp,
        challenge: challenge,
        phoneInput: state.phoneInput,
      );
    } on AuthFailure catch (failure) {
      state = state.copyWith(loading: false, errorCode: failure.code);
    } catch (_) {
      state = state.copyWith(loading: false, errorCode: 'request');
    }
    notifyListeners();
  }

  Future<void> verify() async {
    if (state.code.length != 6 || state.challenge == null) {
      state = state.copyWith(errorCode: 'code');
      notifyListeners();
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    notifyListeners();
    try {
      final session = await _repository.verifyOtp(
        challengeId: state.challenge!.id,
        code: state.code,
      );
      onAuthenticated(session);
    } on AuthFailure catch (failure) {
      state = state.copyWith(loading: false, errorCode: failure.code);
      notifyListeners();
    }
  }

  Future<void> resend() async {
    final challenge = state.challenge;
    if (challenge == null ||
        DateTime.now().isBefore(challenge.resendAvailableAt)) {
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    notifyListeners();
    try {
      state = state.copyWith(
        challenge: await _repository.resendOtp(challenge.id),
        loading: false,
        code: '',
      );
    } on AuthFailure catch (failure) {
      state = state.copyWith(loading: false, errorCode: failure.code);
    }
    notifyListeners();
  }

  Future<void> continueAsGuest() async {
    await _repository.continueAsGuest();
    onGuest();
  }
}
