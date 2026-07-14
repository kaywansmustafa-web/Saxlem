class ArrivalRecommendationService {
  const ArrivalRecommendationService();
  String forDuration(int durationMinutes) => durationMinutes >= 30
      ? 'Please arrive 15 minutes early.'
      : 'Please arrive 10 minutes early.';
}
