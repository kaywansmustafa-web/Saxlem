import 'package:flutter/material.dart';

import '../../../../core/models/recommended_doctor.dart';
import '../../../../design_system/components/content/saxlem_card.dart';
import '../../../../design_system/components/content/saxlem_avatar.dart';

class RecommendedDoctorCard extends StatelessWidget {
  const RecommendedDoctorCard({
    required this.doctor,
    required this.bookLabel,
    required this.priceLabel,
    required this.semanticLabel,
    this.onBookPressed,
    super.key,
  });

  final RecommendedDoctor doctor;
  final String bookLabel;
  final String priceLabel;
  final String semanticLabel;
  final VoidCallback? onBookPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Semantics(
      container: true,
      label: semanticLabel,
      child: SaxlemCard(
        elevation: SaxlemCardElevation.low,
        width: 278,
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _DoctorPhoto(url: doctor.photoUrl, semanticLabel: doctor.name),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        doctor.specialty,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.star_rounded, size: 19, color: colors.tertiary),
                const SizedBox(width: 4),
                Text(
                  doctor.rating.toStringAsFixed(1),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 14),
                Icon(Icons.schedule_rounded, size: 18, color: colors.primary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    doctor.availability,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: Text(
                    priceLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Semantics(
                  button: true,
                  label: '$bookLabel ${doctor.name}',
                  child: FilledButton(
                    onPressed: onBookPressed,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(84, 42),
                      padding: const EdgeInsetsDirectional.symmetric(
                        horizontal: 18,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(bookLabel),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DoctorPhoto extends StatelessWidget {
  const _DoctorPhoto({required this.url, required this.semanticLabel});

  final String? url;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    return SaxlemAvatar(semanticLabel: semanticLabel, imageUrl: url, size: 58);
  }
}
