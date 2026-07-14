import '../repositories/doctor_discovery_repository.dart';

class ToggleMyDoctor {
  const ToggleMyDoctor(this._repository);
  final DoctorDiscoveryRepository _repository;
  Future<bool> call(String doctorId) => _repository.toggleMyDoctor(doctorId);
}
