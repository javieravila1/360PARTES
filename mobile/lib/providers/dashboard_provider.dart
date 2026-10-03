import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'businesses_provider.dart';

final dashboardTimeFilterProvider = StateProvider<String>((ref) => 'this_month');
final dashboardChartTimeFilterProvider = StateProvider<String>((ref) => 'this_week');

final dashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  ref.watch(currentBusinessProvider);
  final timeFilter = ref.watch(dashboardTimeFilterProvider);
  final chartTimeFilter = ref.watch(dashboardChartTimeFilterProvider);
  final response = await apiClient.get('/dashboard/?time_filter=$timeFilter&chart_time_filter=$chartTimeFilter');
  return response.data;
});
