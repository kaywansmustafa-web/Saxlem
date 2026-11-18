import 'package:flutter/material.dart';

class SaxlemTextField extends StatelessWidget {
  const SaxlemTextField({
    required this.label,
    this.controller,
    this.hint,
    this.errorText,
    this.prefixText,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.maxLength,
    this.enabled = true,
    this.autofocus = false,
    this.onChanged,
    this.onSubmitted,
    this.style,
    this.textAlign = TextAlign.start,
    super.key,
  });

  final String label;
  final TextEditingController? controller;
  final String? hint, errorText, prefixText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final int? maxLength;
  final bool enabled, autofocus;
  final ValueChanged<String>? onChanged, onSubmitted;

  /// Optional larger type, e.g. the one-time code.
  final TextStyle? style;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    enabled: enabled,
    autofocus: autofocus,
    keyboardType: keyboardType,
    textInputAction: textInputAction,
    autofillHints: autofillHints,
    maxLength: maxLength,
    onChanged: onChanged,
    onSubmitted: onSubmitted,
    style: style,
    textAlign: textAlign,
    decoration: InputDecoration(
      labelText: label,
      hintText: hint,
      // A spaced-out style (the code field) must not stretch the hint.
      hintStyle: style == null
          ? null
          : Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 0,
              fontWeight: FontWeight.w400,
            ),
      errorText: errorText,
      prefixText: prefixText,
      counterText: '',
    ),
  );
}
