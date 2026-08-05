import 'package:flutter/material.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../controllers/discover_controller.dart';
import '../state/discover_state.dart';

class DoctorDetailsPage extends StatefulWidget {
  const DoctorDetailsPage({
    required this.controller,
    required this.doctorId,
    super.key,
  });
  final DiscoverController controller;
  final String doctorId;
  @override
  State<DoctorDetailsPage> createState() => _DoctorDetailsPageState();
}

class _DoctorDetailsPageState extends State<DoctorDetailsPage> {
  @override
  void initState() {
    super.initState();
    widget.controller.loadDoctor(widget.doctorId);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Doctor profile')),
    body: ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) => switch (widget.controller.detailState) {
        DoctorDetailInitial() || DoctorDetailLoading() => const Center(
          child: CircularProgressIndicator(),
        ),
        DoctorDetailNotFound() => const Center(child: Text('Doctor not found')),
        DoctorDetailFailure() => Center(
          child: FilledButton(
            onPressed: () => widget.controller.loadDoctor(widget.doctorId),
            child: const Text('Try again'),
          ),
        ),
        DoctorDetailReady(:final doctor) => SingleChildScrollView(
          padding: const EdgeInsetsDirectional.all(24),
          child: SaxlemResponsiveContent(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundImage: doctor.photoUrl == null
                      ? null
                      : NetworkImage(doctor.photoUrl!),
                  child: doctor.photoUrl == null
                      ? const Icon(Icons.person_rounded, size: 52)
                      : null,
                ),
                const SizedBox(height: 18),
                Text(
                  doctor.doctorDisplayName,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  doctor.primarySpecialtyDisplayName,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                _row('Experience', '${doctor.yearsOfExperience} years'),
                _row(
                  'Clinics',
                  doctor.clinics.map((clinic) => clinic.name).join(', '),
                ),
                _row('Languages', doctor.languages.join(', ')),
                if (doctor.licenseNumber != null)
                  _row('License', doctor.licenseNumber!),
                if (doctor.biography != null) ...[
                  const SizedBox(height: 20),
                  Text('About', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(doctor.biography!),
                ],
              ],
            ),
          ),
        ),
      },
    ),
  );
  static Widget _row(String label, String value) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}
