import 'package:flutter/material.dart';

import '../domain/entities/auth_session.dart';
import '../domain/repositories/auth_repository.dart';
import 'controllers/auth_controller.dart';
import 'pages/otp_verification_page.dart';
import 'pages/phone_number_page.dart';
import 'pages/welcome_page.dart';
import 'state/auth_state.dart';

class AuthenticationFeature extends StatefulWidget {
  const AuthenticationFeature({
    required this.repository,
    required this.onAuthenticated,
    required this.onGuest,
    this.sessionExpired = false,
    this.developmentOtp,
    super.key,
  });
  final AuthRepository repository;
  final ValueChanged<AuthSession> onAuthenticated;
  final VoidCallback onGuest;
  final bool sessionExpired;
  final String? developmentOtp;

  @override
  State<AuthenticationFeature> createState() => _AuthenticationFeatureState();
}

class _AuthenticationFeatureState extends State<AuthenticationFeature> {
  late final AuthController controller;

  @override
  void initState() {
    super.initState();
    controller = AuthController(
      widget.repository,
      onAuthenticated: widget.onAuthenticated,
      onGuest: widget.onGuest,
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: switch (controller.state.step) {
        AuthStep.welcome => WelcomePage(
          sessionExpired: widget.sessionExpired,
          onContinue: controller.showPhone,
          onContinueAsGuest: controller.continueAsGuest,
        ),
        AuthStep.phone => PhoneNumberPage(controller: controller),
        AuthStep.otp => OtpVerificationPage(
          controller: controller,
          developmentOtp: widget.developmentOtp,
        ),
      },
    ),
  );
}
