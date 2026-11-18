import 'package:flutter/material.dart';

import '../../../core/localization/localization_extensions.dart';

const _gold = Color(0xFFF5A524);

/// Five stars filled to [rating] (halves shown), for reading.
class RatingStars extends StatelessWidget {
  const RatingStars({required this.rating, this.size = 16, super.key});
  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) => Semantics(
    label: context.l10n.starsLabel(rating.toStringAsFixed(1)),
    child: ExcludeSemantics(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 1; i <= 5; i++)
            Icon(
              rating >= i
                  ? Icons.star_rounded
                  : rating >= i - 0.5
                  ? Icons.star_half_rounded
                  : Icons.star_outline_rounded,
              size: size,
              color: rating >= i - 0.5
                  ? _gold
                  : Theme.of(context).disabledColor,
            ),
        ],
      ),
    ),
  );
}

/// "★ 4.8 (23)" for cards; nothing when there are no reviews yet.
class RatingLine extends StatelessWidget {
  const RatingLine({required this.average, required this.count, super.key});
  final double average;
  final int count;

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Semantics(
      label:
          '${context.l10n.starsLabel(average.toStringAsFixed(1))}, ${context.l10n.reviewCount(count)}',
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.star_rounded, size: 16, color: _gold),
            const SizedBox(width: 3),
            Text(
              average.toStringAsFixed(1),
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 4),
            Text('($count)', style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

/// Five large tappable stars for choosing a rating.
class StarPicker extends StatelessWidget {
  const StarPicker({required this.value, required this.onChanged, super.key});
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 1; i <= 5; i++)
          Semantics(
            button: true,
            selected: value == i,
            label: strings.starsLabel('$i'),
            child: IconButton(
              iconSize: 40,
              tooltip: strings.starsLabel('$i'),
              onPressed: () => onChanged(i),
              icon: Icon(
                value >= i ? Icons.star_rounded : Icons.star_outline_rounded,
                color: value >= i ? _gold : Theme.of(context).disabledColor,
              ),
            ),
          ),
      ],
    );
  }
}
