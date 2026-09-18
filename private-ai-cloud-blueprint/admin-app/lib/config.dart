/// API base URL — override at build/run time:
/// flutter run --dart-define=API_BASE_URL=http://localhost:8080/api/v1
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080/api/v1',
  );
}
