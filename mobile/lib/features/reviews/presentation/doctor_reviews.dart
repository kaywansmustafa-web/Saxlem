import 'package:flutter/material.dart';

import '../../../core/formatting/clinic_format.dart';
import '../../../core/localization/localization_extensions.dart';
import '../../../design_system/design_system.dart';
import '../domain/review.dart';
import 'rating_stars.dart';

/// The reviews part of a doctor's profile: the average, how the stars are
/// spread, the newest three, and a way to read them all.
class DoctorReviewsSection extends StatefulWidget {
  const DoctorReviewsSection({
    required this.doctorId,
    required this.doctorName,
    required this.source,
    super.key,
  });
  final String doctorId, doctorName;
  final DoctorReviewsSource source;

  @override
  State<DoctorReviewsSection> createState() => _DoctorReviewsSectionState();
}

class _DoctorReviewsSectionState extends State<DoctorReviewsSection> {
  ReviewPage? _page;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    widget.source
        .doctorReviews(widget.doctorId)
        .then((page) {
          if (mounted) setState(() => _page = page);
        })
        .catchError((Object _) {
          if (mounted) setState(() => _failed = true);
        });
  }

  @override
  Widget build(BuildContext context) {
    final page = _page;
    if (_failed) return const SizedBox.shrink();
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    if (page == null) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (page.count == 0) {
      return Text(
        strings.reviewsNone,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: colors.textSecondary,
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ReviewSummary(page: page),
        const SizedBox(height: 12),
        for (final review in page.items.take(3)) ...[
          ReviewTile(review: review),
          const SizedBox(height: 8),
        ],
        if (page.count > 3)
          SaxlemButton(
            label: strings.reviewsSeeAll(page.count),
            hierarchy: SaxlemButtonHierarchy.secondary,
            expand: true,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => DoctorReviewsPage(
                  doctorId: widget.doctorId,
                  doctorName: widget.doctorName,
                  source: widget.source,
                  first: page,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class ReviewSummary extends StatelessWidget {
  const ReviewSummary({required this.page, super.key});
  final ReviewPage page;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final strings = context.l10n;
    final most = page.distribution.fold<int>(0, (a, b) => a > b ? a : b);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Column(
          children: [
            Text(
              page.average.toStringAsFixed(1),
              style: theme.textTheme.displaySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            RatingStars(rating: page.average),
            const SizedBox(height: 4),
            Text(
              strings.reviewCount(page.count),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(width: 18),
        Expanded(
          child: ExcludeSemantics(
            child: Column(
              children: [
                for (var stars = 5; stars >= 1; stars--)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 14,
                          child: Text(
                            '$stars',
                            style: theme.textTheme.labelSmall,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: most == 0
                                  ? 0
                                  : page.distribution[stars - 1] / most,
                              minHeight: 6,
                              backgroundColor: colors.surfaceSunken,
                              color: const Color(0xFFF5A524),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class ReviewTile extends StatelessWidget {
  const ReviewTile({required this.review, super.key});
  final PublicReview review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final strings = context.l10n;
    final language = Localizations.localeOf(context).languageCode;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surfaceSunken,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RatingStars(rating: review.rating.toDouble(), size: 14),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${review.author ?? strings.reviewAnonymous} · ${ClinicFormat.clinicDay(review.createdAt, language)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          if (review.comment case final comment?) ...[
            const SizedBox(height: 6),
            Text(comment, style: theme.textTheme.bodyMedium),
          ],
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                Icons.verified_rounded,
                size: 13,
                color: colors.positiveContent,
              ),
              const SizedBox(width: 4),
              Text(
                strings.reviewVerified,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colors.positiveContent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Every review of one doctor, newest first.
class DoctorReviewsPage extends StatefulWidget {
  const DoctorReviewsPage({
    required this.doctorId,
    required this.doctorName,
    required this.source,
    required this.first,
    super.key,
  });
  final String doctorId, doctorName;
  final DoctorReviewsSource source;
  final ReviewPage first;

  @override
  State<DoctorReviewsPage> createState() => _DoctorReviewsPageState();
}

class _DoctorReviewsPageState extends State<DoctorReviewsPage> {
  late final List<PublicReview> _items = [...widget.first.items];
  late String? _cursor = widget.first.nextCursor;
  bool _loading = false;

  Future<void> _more() async {
    if (_loading || _cursor == null) return;
    setState(() => _loading = true);
    try {
      final page = await widget.source.doctorReviews(
        widget.doctorId,
        cursor: _cursor,
      );
      if (!mounted) return;
      setState(() {
        _items.addAll(page.items);
        _cursor = page.nextCursor;
      });
    } catch (_) {
      // The button stays; the patient can try again.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(strings.reviewsOf(widget.doctorName))),
      body: SaxlemAuraBackdrop(
        strength: .5,
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SaxlemCard(child: ReviewSummary(page: widget.first)),
              const SizedBox(height: 12),
              for (final review in _items) ...[
                ReviewTile(review: review),
                const SizedBox(height: 8),
              ],
              if (_cursor != null)
                SaxlemButton(
                  label: strings.reviewsMore,
                  hierarchy: SaxlemButtonHierarchy.secondary,
                  expand: true,
                  onPressed: _loading ? null : _more,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
