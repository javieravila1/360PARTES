import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';

// Este provider obtiene todos los negocios del usuario actual
final businessesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await apiClient.get('/businesses/');
  return response.data;
});

// Este StateProvider maneja qué negocio está activo actualmente en la app
class CurrentBusinessNotifier extends StateNotifier<Map<String, dynamic>?> {
  CurrentBusinessNotifier() : super(null);

  Future<void> init(List<dynamic> businesses) async {
    final savedId = ApiClient.memoryBusinessId ?? await ApiClient.storage.read(key: 'business_id');
    
    if (businesses.isNotEmpty) {
      if (savedId != null) {
        final found = businesses.firstWhere(
          (b) => b['business']['id'].toString() == savedId, 
          orElse: () => businesses.first
        );
        state = found['business'];
        await setBusiness(found['business']['id'].toString(), found['business']);
      } else {
        state = businesses.first['business'];
        await setBusiness(businesses.first['business']['id'].toString(), businesses.first['business']);
      }
    }
  }

  Future<void> setBusiness(String id, Map<String, dynamic> businessData) async {
    ApiClient.memoryBusinessId = id;
    await ApiClient.storage.write(key: 'business_id', value: id);
    state = businessData;
  }
}

final currentBusinessProvider = StateNotifierProvider<CurrentBusinessNotifier, Map<String, dynamic>?>((ref) {
  return CurrentBusinessNotifier();
});
