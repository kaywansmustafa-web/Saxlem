import 'dart:async';
import 'package:flutter/material.dart';

import '../../../../core/formatting/ltr_isolate.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/auth_controller.dart';

class OtpVerificationPage extends StatefulWidget {
  const OtpVerificationPage({
    required this.controller,
    this.developmentOtp,
    super.key,
  });
  final AuthController controller;
  final String? developmentOtp;
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
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        leading: BackButton(onPressed: widget.controller.changePhone),
        title: Text(strings.appName),
      ),
      body: SaxlemAuraBackdrop(
        strength: .8,
        child: SafeArea(
          child: SaxlemResponsiveContent(
            child: ListView(
              padding: const EdgeInsetsDirectional.symmetric(
                vertical: SaxlemSpacing.three,
              ),
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Container(
                    width: 64,
                    height: 64,
                    alignment: AlignmentDirectional.center,
                    decoration: BoxDecoration(
                      gradient: context.saxlemColors.deepAura,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: SaxlemElevation.glow(
                        context.saxlemColors.brandPrimary,
                      ),
                    ),
                    child: Icon(
                      Icons.lock_outline_rounded,
                      color: context.saxlemColors.onFill,
                      size: 30,
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  strings.otpTitle,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: SaxlemSpacing.one),
                Text(
                  strings.otpBody(
                    ltrIsolate(state.challenge?.maskedDestination ?? ''),
                  ),
                ),
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
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    letterSpacing: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  errorText: error,
                  onChanged: widget.controller.updateCode,
                  onSubmitted: (_) => widget.controller.verify(),
                ),
                const SizedBox(height: SaxlemSpacing.one),
                if (widget.developmentOtp case final developmentOtp?)
                  Text(
                    strings.developmentCodeHint(ltrIsolate(developmentOtp)),
                    textAlign: TextAlign.center,
                  ),
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
      ),
    );
  }
}
