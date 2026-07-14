import 'dart:convert';

class Patient {
  const Patient({
    required this.id,
    required this.fullName,
    required this.dateOfBirth,
    this.phoneNumber,
    this.email,
  });

  final String id;
  final String fullName;
  final DateTime dateOfBirth;
  final String? phoneNumber;
  final String? email;

  Patient copyWith({
    String? id,
    String? fullName,
    DateTime? dateOfBirth,
    String? phoneNumber,
    String? email,
  }) {
    return Patient(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fullName': fullName,
      'dateOfBirth': dateOfBirth.toIso8601String(),
      'phoneNumber': phoneNumber,
      'email': email,
    };
  }

  factory Patient.fromMap(Map<String, dynamic> map) {
    return Patient(
      id: map['id'] as String,
      fullName: map['fullName'] as String,
      dateOfBirth: DateTime.parse(map['dateOfBirth'] as String),
      phoneNumber: map['phoneNumber'] as String?,
      email: map['email'] as String?,
    );
  }

  String toJson() => jsonEncode(toMap());

  factory Patient.fromJson(String source) {
    return Patient.fromMap(jsonDecode(source) as Map<String, dynamic>);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Patient &&
            other.id == id &&
            other.fullName == fullName &&
            other.dateOfBirth == dateOfBirth &&
            other.phoneNumber == phoneNumber &&
            other.email == email;
  }

  @override
  int get hashCode =>
      Object.hash(id, fullName, dateOfBirth, phoneNumber, email);
}
