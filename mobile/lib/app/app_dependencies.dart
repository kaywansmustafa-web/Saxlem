import 'package:http/http.dart' as http;

import '../config/environment/app_configuration.dart';
import '../core/device/device_identity.dart';
import '../core/network/api_client.dart';
import '../core/network/authenticated_api_client.dart';
import '../core/network/refresh_coordinator.dart';
import '../features/authentication/data/repositories/backend_auth_repository.dart';
import '../features/authentication/data/repositories/mock_auth_repository.dart';
import '../features/authentication/data/repositories/unavailable_auth_repository.dart';
import '../features/authentication/domain/repositories/auth_repository.dart';
import '../features/family_profiles/data/repositories/backend_patient_profiles_repository.dart';
import '../features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import '../features/family_profiles/domain/repositories/patient_profiles_repository.dart';
import '../features/discover/domain/repositories/doctor_discovery_repository.dart';
import '../features/discover/data/repositories/backend_doctor_discovery_repository.dart';
import '../features/discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import '../features/booking/domain/repositories/booking_repository.dart';
import '../features/booking/data/repositories/backend_booking_repository.dart';
import '../features/appointments/domain/repositories/patient_appointments_repository.dart';
import '../features/appointments/data/repositories/backend_patient_appointments_repository.dart';
import '../features/arrival/domain/repositories/patient_arrival_repository.dart';
import '../features/arrival/data/repositories/backend_patient_arrival_repository.dart';
import '../features/live_queue/domain/repositories/live_queue_repository.dart';
import '../features/live_queue/data/repositories/live_queue_repository_impl.dart';
import '../features/notifications/domain/repositories/notifications_repository.dart';
import '../features/notifications/data/repositories/backend_notifications_repository.dart';
import '../features/notifications/data/stream/authenticated_notification_sse_transport.dart';

class AppDependencies {
  const AppDependencies({
    required this.authRepository,
    this.patientProfilesRepository,
    this.doctorDiscoveryRepository =
        const UnavailableDoctorDiscoveryRepository(),
    this.bookingRepository = const UnavailableBookingRepository(),
    this.appointmentsRepository =
        const UnavailablePatientAppointmentsRepository(),
    this.arrivalRepository = const UnavailablePatientArrivalRepository(),
    this.liveQueueRepository = const UnavailableLiveQueueRepository(),
    this.notificationsRepository = const UnavailableNotificationsRepository(),
    this.developmentOtp,
  });

  factory AppDependencies.create({
    required AppConfiguration configuration,
    required SessionStorage sessionStorage,
    DeviceIdentity? deviceIdentity,
    ApiClient? apiClient,
  }) {
    if (configuration.allowMockAuthentication) {
      return AppDependencies(
        authRepository: MockAuthRepository(sessionStorage),
        patientProfilesRepository: InMemoryPatientProfilesRepository(),
        developmentOtp: MockAuthRepository.developmentOtp,
        doctorDiscoveryRepository: const UnavailableDoctorDiscoveryRepository(),
        bookingRepository: const UnavailableBookingRepository(),
        appointmentsRepository:
            const UnavailablePatientAppointmentsRepository(),
      );
    }
    if (!configuration.hasValidApiConfiguration || deviceIdentity == null) {
      return const AppDependencies(authRepository: UnavailableAuthRepository());
    }
    final api =
        apiClient ??
        ApiClient(configuration: configuration, client: http.Client());
    final refreshCoordinator = RefreshCoordinator<StoredSession>();
    late final BackendAuthRepository auth;
    auth = BackendAuthRepository(
      api: api,
      storage: sessionStorage,
      deviceIdentity: deviceIdentity,
      environment: configuration.environment,
      refreshCoordinator: refreshCoordinator,
    );
    final authenticatedApi = AuthenticatedApiClient(
      api: api,
      storage: sessionStorage,
      refresh: auth.refreshSession,
    );
    return AppDependencies(
      authRepository: auth,
      patientProfilesRepository: BackendPatientProfilesRepository(
        authenticatedApi,
      ),
      doctorDiscoveryRepository: BackendDoctorDiscoveryRepository(
        authenticatedApi,
      ),
      bookingRepository: BackendBookingRepository(authenticatedApi),
      appointmentsRepository: BackendPatientAppointmentsRepository(
        authenticatedApi,
      ),
      arrivalRepository: BackendPatientArrivalRepository(authenticatedApi),
      liveQueueRepository: BackendLiveQueueRepository(authenticatedApi),
      notificationsRepository: BackendNotificationsRepository(
        authenticatedApi,
        AuthenticatedNotificationSseTransport(
          configuration: configuration,
          storage: sessionStorage,
          refresh: auth.refreshSession,
        ),
      ),
    );
  }

  final AuthRepository authRepository;
  final PatientProfilesRepository? patientProfilesRepository;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final BookingRepository bookingRepository;
  final PatientAppointmentsRepository appointmentsRepository;
  final PatientArrivalRepository arrivalRepository;
  final LiveQueueRepository liveQueueRepository;
  final NotificationsRepository notificationsRepository;
  final String? developmentOtp;
}
