import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/reviews/data/review_dto.dart';
import 'package:saxlem_app/features/reviews/domain/review.dart';
import 'package:saxlem_app/features/reviews/presentation/doctor_reviews.dart';
import 'package:saxlem_app/features/reviews/presentation/visit_review_card.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

const _id = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

class _Visit implements VisitReviewSource {
  _Visit(this.status);
  VisitReviewStatus status;
  final written = <(int, String?, bool)>[];
  bool reject = false;
  @override
  Future<VisitReviewStatus> visitReview(String appointmentId) async => status;
  @override
  Future<VisitReview> writeReview(
    String appointmentId, {
    required int rating,
    required String? comment,
    required bool anonymous,
  }) async {
    if (reject) throw const ReviewFailure(invalidComment: true);
    written.add((rating, comment, anonymous));
    return VisitReview(
      id: _id,
      rating: rating,
      comment: comment,
      anonymous: anonymous,
      hidden: false,
      updatedAt: DateTime.utc(2026, 11, 19),
    );
  }
}

class _Doctor implements DoctorReviewsSource {
  @override
  Future<ReviewPage> doctorReviews(String doctorId, {String? cursor}) async =>
      ReviewPage(
        average: 4.7,
        count: 3,
        distribution: const [0, 0, 0, 1, 2],
        items: [
          PublicReview(
            id: _id,
            rating: 5,
            comment: 'Explained everything clearly.',
            author: 'Avin K.',
            createdAt: DateTime.utc(2026, 11, 18),
          ),
          PublicReview(
            id: _id,
            rating: 4,
            createdAt: DateTime.utc(2026, 11, 10),
          ),
        ],
      );
}

Widget _app(Widget child, {Locale locale = const Locale('en')}) => MaterialApp(
  theme: AppTheme.light,
  locale: locale,
  supportedLocales: AppLocalizations.supportedLocales,
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  home: Scaffold(body: SingleChildScrollView(child: child)),
);

void main() {
  group('reading reviews from the server', () {
    test('a page, a patient\'s own review and a doctor\'s rating', () {
      final page = ReviewDto.page({
        'summary': {
          'average': 4.5,
          'count': 2,
          'distribution': [0, 0, 0, 1, 1],
        },
        'items': [
          {
            'id': _id,
            'rating': 5,
            'comment': null,
            'author': null,
            'createdAt': '2026-11-18T10:00:00.000Z',
          },
        ],
        'nextCursor': null,
      });
      expect(page.average, 4.5);
      expect(page.items.single.author, isNull);
      expect(ReviewDto.rating({'average': 4.8, 'count': 23}).count, 23);
      expect(
        () => ReviewDto.rating({'average': 7, 'count': 1}),
        throwsFormatException,
      );
      final status = ReviewDto.status({
        'canReview': true,
        'reviewableUntil': '2026-12-18T10:00:00.000Z',
        'review': {
          'id': _id,
          'rating': 4,
          'comment': 'Kind.',
          'anonymous': true,
          'status': 'hidden',
          'createdAt': '2026-11-18T10:00:00.000Z',
          'updatedAt': '2026-11-18T10:00:00.000Z',
        },
      });
      expect(status.review!.hidden, isTrue);
      expect(
        () => ReviewDto.status({'canReview': true, 'review': null}),
        throwsFormatException,
      );
    });

    test('comments with contact details are caught before sending', () {
      expect(commentIsPublicSafe('Waited 15 min, seen at 10:30'), isTrue);
      expect(commentIsPublicSafe('call 0750 123 4567'), isFalse);
      expect(commentIsPublicSafe('www.clinic.com'), isFalse);
      expect(commentIsPublicSafe('me@mail.com'), isFalse);
    });
  });

  testWidgets('a patient rates a visit that took place', (tester) async {
    final source = _Visit(
      VisitReviewStatus(
        canReview: true,
        reviewableUntil: DateTime.utc(2026, 12, 18),
      ),
    );
    await tester.pumpWidget(
      _app(
        VisitReviewCard(
          appointmentId: _id,
          doctorName: 'Dr. Shilan',
          source: source,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('How was your visit?'), findsOneWidget);
    // Nothing to post until a star is chosen.
    await tester.tap(find.text('Post review'));
    expect(source.written, isEmpty);
    await tester.tap(find.byTooltip('4 out of 5 stars'));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'Call me 0750 123 4567');
    await tester.tap(find.text('Post review'));
    await tester.pump();
    expect(source.written, isEmpty);
    expect(
      find.text('Shown to everyone. No links, emails or phone numbers.'),
      findsWidgets,
    );
    await tester.enterText(find.byType(TextField), 'Kind and clear.');
    await tester.tap(find.text('Post without my name'));
    await tester.pump();
    await tester.tap(find.text('Post review'));
    await tester.pumpAndSettle();
    expect(source.written.single, (4, 'Kind and clear.', true));
    expect(
      find.text('Thanks. Your review helps other patients choose.'),
      findsOneWidget,
    );
    expect(find.text('Change'), findsOneWidget);
  });

  testWidgets('a visit that can no longer be rated shows nothing', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        VisitReviewCard(
          appointmentId: _id,
          doctorName: 'Dr. Shilan',
          source: _Visit(const VisitReviewStatus(canReview: false)),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('How was your visit?'), findsNothing);
  });

  testWidgets('a doctor\'s profile shows the average and newest reviews', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        DoctorReviewsSection(
          doctorId: _id,
          doctorName: 'Dr. Shilan',
          source: _Doctor(),
        ),
        locale: const Locale('ar'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('4.7'), findsOneWidget);
    expect(find.text('Explained everything clearly.'), findsOneWidget);
    // No name: "Saxlem patient" in Arabic.
    expect(find.textContaining('مريض في ساخلم'), findsOneWidget);
    expect(find.text('زيارة مؤكدة'), findsNWidgets(2));
  });
}
