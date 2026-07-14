import 'dart:convert';

class Doctor {
  const Doctor({
    required this.id,
    required this.fullName,
    required this.specialty,
    this.phoneNumber,
    this.email,
    this.profileImageUrl,
  });

  final String id;
  final String fullName;
  final String specialty;
  final String? phoneNumber;
  final String? email;
  final String? profileImageUrl;

  Doctor copyWith({
    String? id,
    String? fullName,
    String? specialty,
    String? phoneNumber,
    String? email,
    String? profileImageUrl,
  }) {
    return Doctor(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      specialty: specialty ?? this.specialty,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fullName': fullName,
      'specialty': specialty,
      'phoneNumber': phoneNumber,
      'email': email,
      'profileImageUrl': profileImageUrl,
    };
  }

  factory Doctor.fromMap(Map<String, dynamic> map) {
    return Doctor(
      id: map['id'] as String,
      fullName: map['fullName'] as String,
      specialty: map['specialty'] as String,
      phoneNumber: map['phoneNumber'] as String?,
      email: map['email'] as String?,
      profileImageUrl: map['profileImageUrl'] as String?,
    );
  }

  String toJson() => jsonEncode(toMap());

  factory Doctor.fromJson(String source) {
    return Doctor.fromMap(jsonDecode(source) as Map<String, dynamic>);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Doctor &&
            other.id == id &&
            other.fullName == fullName &&
            other.specialty == specialty &&
            other.phoneNumber == phoneNumber &&
            other.email == email &&
            other.profileImageUrl == profileImageUrl;
  }

  @override
  int get hashCode =>
      Object.hash(id, fullName, specialty, phoneNumber, email, profileImageUrl);
}
