import 'dart:convert';

class Clinic {
  const Clinic({
    required this.id,
    required this.name,
    required this.address,
    this.phoneNumber,
    this.latitude,
    this.longitude,
  });

  final String id;
  final String name;
  final String address;
  final String? phoneNumber;
  final double? latitude;
  final double? longitude;

  Clinic copyWith({
    String? id,
    String? name,
    String? address,
    String? phoneNumber,
    double? latitude,
    double? longitude,
  }) {
    return Clinic(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phoneNumber': phoneNumber,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory Clinic.fromMap(Map<String, dynamic> map) {
    return Clinic(
      id: map['id'] as String,
      name: map['name'] as String,
      address: map['address'] as String,
      phoneNumber: map['phoneNumber'] as String?,
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }

  String toJson() => jsonEncode(toMap());

  factory Clinic.fromJson(String source) {
    return Clinic.fromMap(jsonDecode(source) as Map<String, dynamic>);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Clinic &&
            other.id == id &&
            other.name == name &&
            other.address == address &&
            other.phoneNumber == phoneNumber &&
            other.latitude == latitude &&
            other.longitude == longitude;
  }

  @override
  int get hashCode =>
      Object.hash(id, name, address, phoneNumber, latitude, longitude);
}
