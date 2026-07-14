import 'dart:convert';

class Appointment {
  const Appointment({
    required this.id,
    required this.doctorId,
    required this.patientId,
    required this.clinicId,
    required this.scheduledAt,
    required this.status,
    this.reason,
    this.notes,
  });

  final String id;
  final String doctorId;
  final String patientId;
  final String clinicId;
  final DateTime scheduledAt;
  final String status;
  final String? reason;
  final String? notes;

  Appointment copyWith({
    String? id,
    String? doctorId,
    String? patientId,
    String? clinicId,
    DateTime? scheduledAt,
    String? status,
    String? reason,
    String? notes,
  }) {
    return Appointment(
      id: id ?? this.id,
      doctorId: doctorId ?? this.doctorId,
      patientId: patientId ?? this.patientId,
      clinicId: clinicId ?? this.clinicId,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      status: status ?? this.status,
      reason: reason ?? this.reason,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'doctorId': doctorId,
      'patientId': patientId,
      'clinicId': clinicId,
      'scheduledAt': scheduledAt.toIso8601String(),
      'status': status,
      'reason': reason,
      'notes': notes,
    };
  }

  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      id: map['id'] as String,
      doctorId: map['doctorId'] as String,
      patientId: map['patientId'] as String,
      clinicId: map['clinicId'] as String,
      scheduledAt: DateTime.parse(map['scheduledAt'] as String),
      status: map['status'] as String,
      reason: map['reason'] as String?,
      notes: map['notes'] as String?,
    );
  }

  String toJson() => jsonEncode(toMap());

  factory Appointment.fromJson(String source) {
    return Appointment.fromMap(jsonDecode(source) as Map<String, dynamic>);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Appointment &&
            other.id == id &&
            other.doctorId == doctorId &&
            other.patientId == patientId &&
            other.clinicId == clinicId &&
            other.scheduledAt == scheduledAt &&
            other.status == status &&
            other.reason == reason &&
            other.notes == notes;
  }

  @override
  int get hashCode => Object.hash(
    id,
    doctorId,
    patientId,
    clinicId,
    scheduledAt,
    status,
    reason,
    notes,
  );
}
