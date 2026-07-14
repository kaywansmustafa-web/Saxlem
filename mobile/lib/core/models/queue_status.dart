import 'dart:convert';

class QueueStatus {
  const QueueStatus({
    required this.appointmentId,
    required this.position,
    required this.patientsAhead,
    required this.estimatedWaitMinutes,
    required this.updatedAt,
    required this.isActive,
  });

  final String appointmentId;
  final int position;
  final int patientsAhead;
  final int estimatedWaitMinutes;
  final DateTime updatedAt;
  final bool isActive;

  QueueStatus copyWith({
    String? appointmentId,
    int? position,
    int? patientsAhead,
    int? estimatedWaitMinutes,
    DateTime? updatedAt,
    bool? isActive,
  }) {
    return QueueStatus(
      appointmentId: appointmentId ?? this.appointmentId,
      position: position ?? this.position,
      patientsAhead: patientsAhead ?? this.patientsAhead,
      estimatedWaitMinutes: estimatedWaitMinutes ?? this.estimatedWaitMinutes,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'appointmentId': appointmentId,
      'position': position,
      'patientsAhead': patientsAhead,
      'estimatedWaitMinutes': estimatedWaitMinutes,
      'updatedAt': updatedAt.toIso8601String(),
      'isActive': isActive,
    };
  }

  factory QueueStatus.fromMap(Map<String, dynamic> map) {
    return QueueStatus(
      appointmentId: map['appointmentId'] as String,
      position: map['position'] as int,
      patientsAhead: map['patientsAhead'] as int,
      estimatedWaitMinutes: map['estimatedWaitMinutes'] as int,
      updatedAt: DateTime.parse(map['updatedAt'] as String),
      isActive: map['isActive'] as bool,
    );
  }

  String toJson() => jsonEncode(toMap());

  factory QueueStatus.fromJson(String source) {
    return QueueStatus.fromMap(jsonDecode(source) as Map<String, dynamic>);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is QueueStatus &&
            other.appointmentId == appointmentId &&
            other.position == position &&
            other.patientsAhead == patientsAhead &&
            other.estimatedWaitMinutes == estimatedWaitMinutes &&
            other.updatedAt == updatedAt &&
            other.isActive == isActive;
  }

  @override
  int get hashCode => Object.hash(
    appointmentId,
    position,
    patientsAhead,
    estimatedWaitMinutes,
    updatedAt,
    isActive,
  );
}
