import 'package:flutter/material.dart';

import '../../../core/formatting/clinic_format.dart';
import '../../../core/localization/localization_extensions.dart';
import '../../../design_system/design_system.dart';
import '../domain/review.dart';
import 'rating_stars.dart';
import '../../../core/app_config/app_config_store.dart';

/// "How was your visit?" on a visit that took place: stars, an optional
/// comment and whether to show the patient's name. Hidden when the visit
/// can't be rated.
class VisitReviewCard extends StatefulWidget {
  const VisitReviewCard({
    required this.appointmentId,
    required this.doctorName,
    required this.source,
    super.key,
  });
  final String appointmentId, doctorName;
  final VisitReviewSource source;

  @override
  State<VisitReviewCard> createState() => _VisitReviewCardState();
}

class _VisitReviewCardState extends State<VisitReviewCard> {
  VisitReviewStatus? _status;
  bool _editing = false, _busy = false, _anonymous = false;
  int _rating = 0;
  String? _problem;
  final _comment = TextEditingController();

  @override
  void initState() {
    super.initState();
    widget.source
        .visitReview(widget.appointmentId)
        .then((status) {
          if (!mounted) return;
          setState(() {
            _status = status;
            _editing = status.canReview && status.review == null;
            _fill(status.review);
          });
        })
        .catchError((Object _) {});
  }

  void _fill(VisitReview? review) {
    _rating = review?.rating ?? 0;
    _anonymous = review?.anonymous ?? false;
    _comment.text = review?.comment ?? '';
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    final strings = context.l10n;
    final text = _comment.text.trim();
    if (text.isNotEmpty && !commentIsPublicSafe(text)) {
      setState(() => _problem = strings.rateCommentRule);
      return;
    }
    setState(() {
      _busy = true;
      _problem = null;
    });
    try {
      final review = await widget.source.writeReview(
        widget.appointmentId,
        rating: _rating,
        comment: text.isEmpty ? null : text,
        anonymous: _anonymous,
      );
      if (!mounted) return;
      setState(() {
        _status = VisitReviewStatus(
          canReview: _status?.canReview ?? true,
          reviewableUntil: _status?.reviewableUntil,
          review: review,
        );
        _editing = false;
      });
    } on ReviewFailure catch (failure) {
      if (mounted) {
        setState(
          () => _problem = failure.invalidComment
              ? strings.rateCommentRule
              : strings.rateFailed,
        );
      }
    } catch (_) {
      if (mounted) setState(() => _problem = strings.rateFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _status;
    if (status == null || (!status.canReview && status.review == null)) {
      return const SizedBox.shrink();
    }
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final review = status.review;
    final language = Localizations.localeOf(context).languageCode;
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 16),
      child: SaxlemCard(
        child: AnimatedSize(
          duration: SaxlemMotion.standard,
          alignment: AlignmentDirectional.topStart,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(strings.rateTitle, style: theme.textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(
                strings.rateWith(widget.doctorName),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              if (!_editing && review != null) ...[
                Row(
                  children: [
                    RatingStars(rating: review.rating.toDouble(), size: 22),
                    const Spacer(),
                    if (status.canReview && !review.hidden)
                      TextButton(
                        onPressed: () => setState(() {
                          _fill(review);
                          _editing = true;
                        }),
                        child: Text(strings.rateEdit),
                      ),
                  ],
                ),
                if (review.comment case final comment?) ...[
                  const SizedBox(height: 4),
                  Text(comment, style: theme.textTheme.bodyMedium),
                ],
                const SizedBox(height: 6),
                Text(
                  review.hidden ? strings.rateRemoved : strings.rateThanks,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: review.hidden
                        ? colors.cautionContent
                        : colors.positiveContent,
                  ),
                ),
              ] else ...[
                StarPicker(
                  value: _rating,
                  onChanged: (value) => setState(() => _rating = value),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _comment,
                  maxLength: context.appConfig.reviewCommentMax,
                  minLines: 2,
                  maxLines: 5,
                  decoration: InputDecoration(
                    hintText: strings.rateCommentHint,
                    helperText: strings.rateCommentRule,
                    helperMaxLines: 2,
                  ),
                ),
                Material(
                  type: MaterialType.transparency,
                  child: SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    value: _anonymous,
                    onChanged: (value) => setState(() => _anonymous = value),
                    title: Text(strings.rateAnonymous),
                  ),
                ),
                if (_problem case final problem?)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        problem,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.criticalContent,
                        ),
                      ),
                    ),
                  ),
                SaxlemButton(
                  label: review == null ? strings.ratePost : strings.rateUpdate,
                  leadingIcon: Icons.star_rounded,
                  expand: true,
                  onPressed: _rating == 0 || _busy ? null : _post,
                ),
                if (status.reviewableUntil case final until?) ...[
                  const SizedBox(height: 6),
                  Text(
                    strings.rateEditUntil(
                      ClinicFormat.clinicDay(until, language),
                    ),
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.textMuted,
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
