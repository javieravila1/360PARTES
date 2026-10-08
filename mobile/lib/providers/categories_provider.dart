import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'businesses_provider.dart';

final categoriesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final currentBusiness = ref.watch(currentBusinessProvider);
  if (currentBusiness == null) throw Exception('Waiting for business');
  final response = await apiClient.get('/categories/');
  return response.data;
});

