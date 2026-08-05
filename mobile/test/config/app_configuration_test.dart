import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';

void main() {
  group('API configuration', () {
    test('accepts development HTTP on explicit local hosts', () {
      for (final host in [
        'localhost',
        '127.0.0.1',
        '10.0.2.2',
        '192.168.1.20',
      ]) {
        final configuration = _configuration(
          environment: 'development',
          url: 'http://$host:3000',
        );
        expect(configuration.hasValidApiConfiguration, isTrue);
        expect(configuration.apiV1BaseUri.path, '/api/v1/');
      }
    });

    test('accepts HTTPS in QA and production', () {
      for (final environment in ['qa', 'production']) {
        final configuration = _configuration(environment: environment);
        expect(configuration.hasValidApiConfiguration, isTrue);
        expect(configuration.apiV1BaseUri.scheme, 'https');
      }
    });

    test('missing and malformed URLs fail closed', () {
      for (final url in ['', 'not a url', '/api/v1']) {
        expect(_configuration(url: url).hasValidApiConfiguration, isFalse);
      }
    });

    test('rejects credentials, query strings, and fragments', () {
      for (final url in [
        'https://user:password@api.saxlem.test',
        'https://@api.saxlem.test',
        'https://api.saxlem.test?mode=test',
        'https://api.saxlem.test#fragment',
      ]) {
        expect(_configuration(url: url).hasValidApiConfiguration, isFalse);
      }
    });

    test('rejects unsafe QA and production HTTP', () {
      for (final environment in ['qa', 'production']) {
        expect(
          _configuration(
            environment: environment,
            url: 'http://localhost:3000',
          ).hasValidApiConfiguration,
          isFalse,
        );
      }
      expect(
        _configuration(
          environment: 'development',
          url: 'http://api.saxlem.test',
        ).hasValidApiConfiguration,
        isFalse,
      );
    });

    test('rejects invalid timeout values', () {
      for (final timeout in ['', '0', '-1', '1.5', '61', 'invalid']) {
        expect(
          _configuration(timeout: timeout).hasValidApiConfiguration,
          isFalse,
        );
      }
      expect(_configuration(timeout: '1').apiTimeout.inSeconds, 1);
      expect(_configuration(timeout: '60').apiTimeout.inSeconds, 60);
    });

    test('normalizes the API v1 base path without duplication', () {
      final fromOrigin = _configuration(url: 'https://api.saxlem.test/');
      final fromVersioned = _configuration(
        url: 'https://api.saxlem.test/api/v1/',
      );

      expect(
        fromOrigin.apiV1BaseUri.toString(),
        'https://api.saxlem.test/api/v1/',
      );
      expect(fromVersioned.apiV1BaseUri, fromOrigin.apiV1BaseUri);
      expect(
        fromOrigin.apiEndpoint('/patients/me').toString(),
        'https://api.saxlem.test/api/v1/patients/me',
      );
      expect(
        () => fromOrigin.apiEndpoint('//other.test/path'),
        throwsArgumentError,
      );
      expect(
        () => fromOrigin.apiEndpoint('../patients/me'),
        throwsArgumentError,
      );
      expect(
        () => fromOrigin.apiEndpoint('/api/v1/patients/me'),
        throwsArgumentError,
      );
    });

    test('production configuration fails closed when URL is missing', () {
      final configuration = _configuration(environment: 'production', url: '');

      expect(configuration.hasValidApiConfiguration, isFalse);
      expect(() => configuration.apiV1BaseUri, throwsStateError);
      expect(() => configuration.apiTimeout, throwsStateError);
    });
  });
}

AppConfiguration _configuration({
  String environment = 'production',
  String url = 'https://api.saxlem.test',
  String timeout = '15',
}) => AppConfiguration.fromValues(
  environment: environment,
  apiBaseUrl: url,
  apiTimeoutSeconds: timeout,
);
