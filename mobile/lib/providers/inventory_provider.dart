import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'businesses_provider.dart';

final inventoryProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  ref.watch(currentBusinessProvider);
  final response = await apiClient.get('/products/');
  return response.data;
});
