import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart'; // Para kIsWeb
import 'dart:io' show Platform;

class ApiClient {
  static const storage = FlutterSecureStorage();
  static String? memoryBusinessId;
  static String? memoryAuthToken;
  
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api/v1'; // Para Flutter Web
    } else if (Platform.isAndroid) {
      return 'http://98.82.141.34:8000/api/v1'; // Para Android Emulator
    } else {
      return 'http://98.82.141.34:8000/api/v1'; // Para iOS Simulator u otros
    }
  }

  final Dio dio;

  ApiClient() : dio = Dio(BaseOptions(baseUrl: baseUrl)) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = memoryAuthToken ?? await storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        final businessId = memoryBusinessId ?? await storage.read(key: 'business_id');
        if (businessId != null && !options.headers.containsKey('x-business-id') && !options.headers.containsKey('X-Business-ID')) {
          options.headers['X-Business-ID'] = businessId;
        }
        
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Token expirado o inválido
          await storage.delete(key: 'auth_token');
          // Idealmente, redirigir al login aquí (lo manejaremos con Riverpod)
        }
        return handler.next(e);
      },
    ));
  }
}

final apiClient = ApiClient().dio;



