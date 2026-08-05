import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_page.dart';

class DoctorContractException implements Exception {
  const DoctorContractException();
}

class BackendDoctorDiscoveryParser {
  const BackendDoctorDiscoveryParser();
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static const _languages = {
    'badiniKurdish',
    'soraniKurdish',
    'arabic',
    'english',
    'turkish',
  };

  DoctorSearchPage page(Map<String, dynamic> json) {
    _keys(json, {'items', 'page', 'pageSize', 'total', 'totalPages'});
    final raw = _list(json['items'], 100);
    final items = raw
        .map((value) => doctor(_map(value), detail: false))
        .toList(growable: false);
    if (items.map((value) => value.doctorId).toSet().length != items.length) {
      throw const DoctorContractException();
    }
    final page = _integer(json['page'], 1, 10000);
    final pageSize = _integer(json['pageSize'], 1, 100);
    final total = _integer(json['total'], 0, 10000000);
    final totalPages = _integer(json['totalPages'], 0, 10000);
    if ((total == 0) != (totalPages == 0) ||
        items.length > pageSize ||
        (totalPages > 0 && page > totalPages)) {
      throw const DoctorContractException();
    }
    return DoctorSearchPage(
      results: items,
      page: page,
      pageSize: pageSize,
      totalCount: total,
      totalPages: totalPages,
    );
  }

  DoctorDiscoveryResult doctor(
    Map<String, dynamic> json, {
    required bool detail,
  }) {
    final base = {
      'id',
      'displayName',
      'fullName',
      'specialty',
      'gender',
      'status',
      'yearsOfExperience',
      'languages',
      'profileImageUrl',
      'clinics',
      'availability',
    };
    final detailKeys = {
      'firstName',
      'lastName',
      'licenseNumber',
      'biography',
      'specialties',
    };
    _keys(json, detail ? {...base, ...detailKeys} : base);
    final id = _id(json['id']);
    final displayName = _text(json['displayName'], 1, 160);
    final fullName = _text(json['fullName'], 1, 160);
    if (displayName != fullName) throw const DoctorContractException();
    final clinics = _list(
      json['clinics'],
      100,
    ).map((e) => clinic(_map(e))).toList(growable: false);
    if (clinics.isEmpty ||
        clinics.map((e) => e.id).toSet().length != clinics.length) {
      throw const DoctorContractException();
    }
    final languages = _list(
      json['languages'],
      20,
    ).map((e) => _enumText(e, _languages)).toList(growable: false);
    if (languages.toSet().length != languages.length) {
      throw const DoctorContractException();
    }
    final image = _nullableText(json['profileImageUrl'], 2048);
    if (image != null) {
      final uri = Uri.tryParse(image);
      if (uri == null ||
          !uri.isAbsolute ||
          (uri.scheme != 'https' && uri.scheme != 'http')) {
        throw const DoctorContractException();
      }
    }
    return DoctorDiscoveryResult(
      doctorId: id,
      doctorDisplayName: displayName,
      fullName: fullName,
      primarySpecialtyDisplayName: _text(json['specialty'], 1, 160),
      gender: BackendDoctorGender.values.byName(
        _enumText(json['gender'], {'female', 'male', 'unspecified'}),
      ),
      status: BackendDoctorStatus.values.byName(
        _enumText(json['status'], {'active', 'inactive'}),
      ),
      yearsOfExperience: _integer(json['yearsOfExperience'], 0, 80),
      languages: languages,
      clinics: clinics,
      availability: availability(_map(json['availability'])),
      photoUrl: image,
      firstName: detail ? _text(json['firstName'], 1, 120) : null,
      lastName: detail ? _text(json['lastName'], 1, 120) : null,
      licenseNumber: detail ? _text(json['licenseNumber'], 1, 160) : null,
      biography: detail ? _text(json['biography'], 1, 5000) : null,
      specialties: detail
          ? _list(
              json['specialties'],
              100,
            ).map((e) => specialty(_map(e))).toList(growable: false)
          : const [],
    );
  }

  DoctorDiscoveryOptions options(Map<String, dynamic> json) {
    _keys(json, {
      'specialties',
      'clinics',
      'languages',
      'genders',
      'experience',
    });
    final specialties = _list(json['specialties'], 200)
        .map((e) {
          final m = _map(e);
          _keys(m, {'code', 'displayName'});
          return DoctorSpecialtyOption(
            code: _text(m['code'], 1, 64),
            displayName: _text(m['displayName'], 1, 160),
          );
        })
        .toList(growable: false);
    final clinics = _list(
      json['clinics'],
      200,
    ).map((e) => clinic(_map(e))).toList(growable: false);
    final languages = _list(
      json['languages'],
      20,
    ).map((e) => _enumText(e, _languages)).toList(growable: false);
    final genders = _list(json['genders'], 3)
        .map(
          (e) => BackendDoctorGender.values.byName(
            _enumText(e, {'female', 'male', 'unspecified'}),
          ),
        )
        .toList(growable: false);
    final exp = _map(json['experience']);
    _keys(exp, {'minimum', 'maximum'});
    final minimum = _nullableInteger(exp['minimum'], 0, 80);
    final maximum = _nullableInteger(exp['maximum'], 0, 80);
    if ((minimum == null) != (maximum == null) ||
        (minimum != null && minimum > maximum!)) {
      throw const DoctorContractException();
    }
    if (specialties.map((e) => e.code).toSet().length != specialties.length ||
        clinics.map((e) => e.id).toSet().length != clinics.length ||
        languages.toSet().length != languages.length ||
        genders.toSet().length != genders.length) {
      throw const DoctorContractException();
    }
    return DoctorDiscoveryOptions(
      specialties: specialties,
      clinics: clinics,
      languages: languages,
      genders: genders,
      minimumExperience: minimum,
      maximumExperience: maximum,
    );
  }

  DoctorClinicReference clinic(Map<String, dynamic> json) {
    _keys(json, {'id', 'name'});
    return DoctorClinicReference(
      id: _id(json['id']),
      name: _text(json['name'], 1, 160),
    );
  }

  DoctorSpecialty specialty(Map<String, dynamic> json) {
    _keys(json, {'id', 'code', 'displayName', 'isPrimary'});
    if (json['isPrimary'] is! bool) throw const DoctorContractException();
    return DoctorSpecialty(
      id: _id(json['id']),
      code: _text(json['code'], 1, 64),
      displayName: _text(json['displayName'], 1, 160),
      isPrimary: json['isPrimary'] as bool,
    );
  }

  DoctorAvailabilityFoundation availability(Map<String, dynamic> json) {
    _keys(json, {
      'status',
      'acceptingNewPatients',
      'nextAvailableAt',
      'updatedAt',
    });
    if (json['acceptingNewPatients'] is! bool) {
      throw const DoctorContractException();
    }
    return DoctorAvailabilityFoundation(
      status: DoctorAvailabilityStatus.values.byName(
        _enumText(json['status'], {'available', 'unavailable'}),
      ),
      acceptingNewPatients: json['acceptingNewPatients'] as bool,
      nextAvailableAt: _nullableDate(json['nextAvailableAt']),
      updatedAt: _nullableDate(json['updatedAt']),
    );
  }

  void validateProfile(Map<String, dynamic> json, String id) {
    _keys(json, {
      'id',
      'displayName',
      'fullName',
      'specialty',
      'gender',
      'licenseNumber',
      'yearsOfExperience',
      'biography',
      'languages',
      'profileImageUrl',
      'specialties',
    });
    if (_id(json['id']) != id) throw const DoctorContractException();
    _text(json['displayName'], 1, 160);
    _text(json['fullName'], 1, 160);
    _text(json['specialty'], 1, 160);
    _text(json['licenseNumber'], 1, 160);
    _integer(json['yearsOfExperience'], 0, 80);
    _text(json['biography'], 1, 5000);
    _enumText(json['gender'], {'female', 'male', 'unspecified'});
    for (final value in _list(json['languages'], 20)) {
      _enumText(value, _languages);
    }
    for (final value in _list(json['specialties'], 100)) {
      specialty(_map(value));
    }
    _nullableText(json['profileImageUrl'], 2048);
  }

  void validateSpecialties(List<Object?> json) {
    if (json.length > 100) throw const DoctorContractException();
    for (final value in json) {
      specialty(_map(value));
    }
  }

  void validateScheduleAvailability(Map<String, dynamic> json, String id) {
    _keys(json, {'doctorId', 'evaluatedAt', 'clinics'});
    if (_id(json['doctorId']) != id ||
        DateTime.tryParse(_text(json['evaluatedAt'], 1, 64)) == null) {
      throw const DoctorContractException();
    }
    final clinics = _list(json['clinics'], 100);
    for (final value in clinics) {
      final m = _map(value);
      _keys(m, {
        'clinicId',
        'clinicName',
        'timezone',
        'localDate',
        'status',
        'isWorkingNow',
      });
      _id(m['clinicId']);
      _text(m['clinicName'], 1, 160);
      _text(m['timezone'], 1, 80);
      if (!RegExp(
        r'^\d{4}-\d{2}-\d{2}$',
      ).hasMatch(_text(m['localDate'], 10, 10))) {
        throw const DoctorContractException();
      }
      _enumText(m['status'], {'workingToday', 'closedToday', 'unavailable'});
      if (m['isWorkingNow'] is! bool) throw const DoctorContractException();
    }
  }

  static Map<String, dynamic> _map(Object? value) =>
      value is Map<String, dynamic>
      ? value
      : throw const DoctorContractException();
  static List<Object?> _list(Object? value, int max) =>
      value is List<Object?> && value.length <= max
      ? value
      : throw const DoctorContractException();
  static void _keys(Map<String, dynamic> value, Set<String> expected) {
    if (value.keys.toSet().difference(expected).isNotEmpty ||
        expected.difference(value.keys.toSet()).isNotEmpty) {
      throw const DoctorContractException();
    }
  }

  static String _id(Object? value) {
    final text = _text(value, 36, 36);
    if (!_uuid.hasMatch(text)) throw const DoctorContractException();
    return text;
  }

  static String _text(Object? value, int min, int max) {
    if (value is! String ||
        value.length < min ||
        value.length > max ||
        value.trim() != value ||
        value.codeUnits.any((c) => c < 0x20 || c == 0x7f)) {
      throw const DoctorContractException();
    }
    return value;
  }

  static String? _nullableText(Object? value, int max) =>
      value == null ? null : _text(value, 1, max);
  static String _enumText(Object? value, Set<String> values) {
    final text = _text(value, 1, 64);
    if (!values.contains(text)) throw const DoctorContractException();
    return text;
  }

  static int _integer(Object? value, int min, int max) {
    if (value is! int || value < min || value > max) {
      throw const DoctorContractException();
    }
    return value;
  }

  static int? _nullableInteger(Object? value, int min, int max) =>
      value == null ? null : _integer(value, min, max);
  static DateTime? _nullableDate(Object? value) {
    if (value == null) return null;
    final date = DateTime.tryParse(_text(value, 1, 64));
    if (date == null || !date.isUtc) throw const DoctorContractException();
    return date;
  }
}
