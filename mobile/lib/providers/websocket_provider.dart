import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:async';
import '../api/api_client.dart';
import 'businesses_provider.dart';
import 'inventory_provider.dart';
import 'sales_provider.dart';
import 'dashboard_provider.dart';

final websocketProvider = Provider<WebSocketChannel?>((ref) {
  final currentBusiness = ref.watch(currentBusinessProvider);
  if (currentBusiness == null) return null;

  final wsBaseUrl = ApiClient.baseUrl.replaceFirst('http', 'ws');
  WebSocketChannel? channel;
  Timer? reconnectTimer;

  void connect() {
    channel = WebSocketChannel.connect(Uri.parse('$wsBaseUrl/ws'));
    channel!.stream.listen(
      (message) {
        ref.invalidate(inventoryProvider);
        ref.invalidate(salesProvider);
        ref.invalidate(dashboardProvider);
      },
      onError: (e) {
        reconnectTimer?.cancel();
        reconnectTimer = Timer(const Duration(seconds: 3), connect);
      },
      onDone: () {
        reconnectTimer?.cancel();
        reconnectTimer = Timer(const Duration(seconds: 3), connect);
      },
    );
  }

  connect();

  ref.onDispose(() {
    reconnectTimer?.cancel();
    channel?.sink.close();
  });

  return channel;
});
