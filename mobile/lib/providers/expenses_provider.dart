import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'businesses_provider.dart';

final expensesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  ref.watch(currentBusinessProvider);
  final response = await apiClient.get('/cash/expenses');
  return response.data;
});

final payablesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  ref.watch(currentBusinessProvider);
  final response = await apiClient.get('/debts/?debt_type=PAYABLE');
  return response.data;
});
