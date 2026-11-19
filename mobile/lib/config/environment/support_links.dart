import '../../core/app_config/app_config.dart';

/// Help links. The owner sets them in Owner Portal → App settings; a build
/// can also carry them (--dart-define) as a fallback. A link that isn't set
/// is simply not shown, so patients never meet a dead end.
class SupportLinks {
  const SupportLinks._();

  static const _whatsApp = String.fromEnvironment('SAXLEM_SUPPORT_WHATSAPP');
  static const _terms = String.fromEnvironment('SAXLEM_TERMS_URL');
  static const _privacy = String.fromEnvironment('SAXLEM_PRIVACY_URL');

  /// "1.0.0 (12)", or empty when the build didn't say.
  static const version = String.fromEnvironment('SAXLEM_APP_VERSION');

  /// Saxlem support on WhatsApp, international digits only (9647501234567).
  static Uri? whatsApp(AppConfig config) {
    final digits = _pick(config.supportWhatsApp, _whatsApp);
    return RegExp(r'^[1-9]\d{7,14}$').hasMatch(digits)
        ? Uri.https('wa.me', '/$digits')
        : null;
  }

  static Uri? terms(AppConfig config) => _https(_pick(config.termsUrl, _terms));
  static Uri? privacy(AppConfig config) =>
      _https(_pick(config.privacyUrl, _privacy));

  static String _pick(String owner, String build) =>
      owner.isNotEmpty ? owner : build;

  static Uri? _https(String value) {
    final uri = Uri.tryParse(value);
    return uri != null && uri.scheme == 'https' && uri.host.isNotEmpty
        ? uri
        : null;
  }
}
