import 'package:flutter/material.dart';

import '../../../../core/models/specialty.dart';

class SpecialtyCard extends StatefulWidget {
  const SpecialtyCard({
    required this.specialty,
    required this.semanticLabel,
    this.onTap,
    super.key,
  });

  final Specialty specialty;
  final String semanticLabel;
  final VoidCallback? onTap;

  @override
  State<SpecialtyCard> createState() => _SpecialtyCardState();
}

class _SpecialtyCardState extends State<SpecialtyCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Semantics(
      button: true,
      label: widget.semanticLabel,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
        child: Material(
          color: colors.surface,
          elevation: _pressed ? 0 : 1,
          shadowColor: colors.shadow.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(22),
          child: InkWell(
            onTap: widget.onTap,
            onHighlightChanged: (value) => setState(() => _pressed = value),
            borderRadius: BorderRadius.circular(22),
            child: SizedBox(
              width: 104,
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(12, 16, 12, 14),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: colors.primary.withValues(alpha: 0.09),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        _iconFor(widget.specialty.iconKey),
                        color: colors.primary,
                      ),
                    ),
                    const SizedBox(height: 11),
                    Text(
                      widget.specialty.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colors.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _iconFor(String key) => switch (key) {
    'dentist' => Icons.medical_services_outlined,
    'cardiology' => Icons.favorite_outline_rounded,
    'pediatrics' => Icons.child_care_rounded,
    'eye' => Icons.visibility_outlined,
    'neurology' => Icons.psychology_outlined,
    _ => Icons.health_and_safety_outlined,
  };
}
