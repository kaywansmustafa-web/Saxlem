import 'dart:async';
import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/auth_controller.dart';

class OtpVerificationPage extends StatefulWidget {
  const OtpVerificationPage({required this.controller, super.key});
  final AuthController controller;
  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final state = widget.controller.state;
    final seconds = state.challenge == null
        ? 0
        : state.challenge!.resendAvailableAt
              .difference(DateTime.now())
              .inSeconds
              .clamp(0, 30);
    final error = switch (state.errorCode) {
      'invalid' || 'code' => strings.otpInvalid,
      'expired' => strings.otpExpired,
      'limited' => strings.otpLimited,
      null => null,
      _ => strings.authUnavailable,
    };
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: widget.controller.changePhone),
        title: Text(strings.appName),
      ),
      body: SafeArea(
        child: SaxlemResponsiveContent(
          child: ListView(
            padding: const EdgeInsetsDirectional.symmetric(
              vertical: SaxlemSpacing.three,
            ),
            children: [
              Text(
                strings.otpTitle,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: SaxlemSpacing.one),
              Text(strings.otpBody(state.challenge?.maskedDestination ?? '')),
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemTextField(
                label: strings.otpLabel,
                hint: strings.otpHint,
                autofocus: true,
                enabled: !state.loading,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.oneTimeCode],
                maxLength: 6,
                errorText: error,
                onChanged: widget.controller.updateCode,
                onSubmitted: (_) => widget.controller.verify(),
              ),
              const SizedBox(height: SaxlemSpacing.one),
              Text(strings.developmentCodeHint, textAlign: TextAlign.center),
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemButton(
                label: strings.verify,
                onPressed: widget.controller.verify,
                loading: state.loading,
                expand: true,
              ),
              const SizedBox(height: SaxlemSpacing.one),
              SaxlemButton(
                label: seconds > 0
                    ? strings.resendIn(seconds)
                    : strings.resendCode,
                onPressed: seconds > 0 ? null : widget.controller.resend,
                hierarchy: SaxlemButtonHierarchy.tertiary,
                expand: true,
              ),
              SaxlemButton(
                label: strings.changeNumber,
                onPressed: widget.controller.changePhone,
                hierarchy: SaxlemButtonHierarchy.tertiary,
                expand: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
