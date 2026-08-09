class AppointmentSlot {
  const AppointmentSlot({
    required this.startsAt,
    required this.endsAt,
    required this.durationMinutes,
  });
  final DateTime startsAt, endsAt;
  final int durationMinutes;
}
