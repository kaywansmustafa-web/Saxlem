class RecommendedDoctor {
  const RecommendedDoctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.rating,
    required this.availability,
    required this.price,
    required this.currency,
    this.photoUrl,
  });

  final String id;
  final String name;
  final String specialty;
  final double rating;
  final String availability;
  final double price;
  final String currency;
  final String? photoUrl;
}
