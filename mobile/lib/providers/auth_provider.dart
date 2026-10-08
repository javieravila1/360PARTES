import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({this.isLoading = false, this.isAuthenticated = false, this.error});

  AuthState copyWith({bool? isLoading, bool? isAuthenticated, String? error}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await ApiClient.storage.read(key: 'auth_token');
    if (token != null) {
      state = state.copyWith(isAuthenticated: true);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final formData = FormData.fromMap({
        'username': email,
        'password': password,
      });

      final response = await apiClient.post('/auth/login', data: formData);
      final token = response.data['access_token'];

      ApiClient.memoryAuthToken = token;
      await ApiClient.storage.write(key: 'auth_token', value: token);

      state = state.copyWith(isLoading: false, isAuthenticated: true);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data['detail'] ?? 'Error de conexión',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error inesperado');
      return false;
    }
  }

  Future<void> logout() async {
    ApiClient.memoryAuthToken = null;
    ApiClient.memoryBusinessId = null;
    await ApiClient.storage.delete(key: 'auth_token');
    await ApiClient.storage.delete(key: 'business_id');
    state = state.copyWith(isAuthenticated: false);
  }
}
