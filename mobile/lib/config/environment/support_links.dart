/// Help links, set at build time (--dart-define). A link that isn't set is
/// simply not shown, so a build never points patients at a dead end.
class SupportLinks {
  const SupportLinks._();

  static const _whatsApp = String.fromEnvironment('SAXLEM_SUPPORT_WHATSAPP');
  static const _terms = String.fromEnvironment('SAXLEM_TERMS_URL');
  static const _privacy = String.fromEnvironment('SAXLEM_PRIVACY_URL');

  /// "1.0.0 (12)", or empty when the build didn't say.
  static const version = String.fromEnvironment('SAXLEM_APP_VERSION');

  /// Saxlem support on WhatsApp, international digits only (9647501234567).
  static Uri? get whatsApp => RegExp(r'^[1-9]\d{7,14}$').hasMatch(_whatsApp)
      ? Uri.https('wa.me', '/$_whatsApp')
      : null;
  static Uri? get terms => _https(_terms);
  static Uri? get privacy => _https(_privacy);

  static Uri? _https(String value) {
    final uri = Uri.tryParse(value);
    return uri != null && uri.scheme == 'https' && uri.host.isNotEmpty
        ? uri
        : null;
  }
}
