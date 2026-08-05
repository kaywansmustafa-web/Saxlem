import 'package:saxlem_app/core/storage/secure_key_value_store.dart';

class MemorySecureStore implements SecureKeyValueStore {
  final Map<String, String> values = {};
  int writes = 0;

  @override
  Future<void> delete(String key) async => values.remove(key);

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    writes++;
    values[key] = value;
  }
}
