class ScheduleRule {
  const ScheduleRule({
    required this.weekday,
    required this.startMinute,
    required this.endMinute,
    required this.durationMinutes,
    this.bufferMinutes = 0,
  });
  final int weekday, startMinute, endMinute, durationMinutes, bufferMinutes;
}
