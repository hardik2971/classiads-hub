import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'api_exception.dart';

/// Unwrapped successful response: the envelope's `data` + `message` + `meta`.
class ApiResult {
  ApiResult(this.data, this.message, this.meta);
  final dynamic data; // Map, List, or null
  final String message;
  final Map<String, dynamic>? meta;

  Map<String, dynamic> get map => (data as Map?)?.cast<String, dynamic>() ?? {};
  List<dynamic> get list => (data as List?) ?? const [];
}

/// Thin wrapper over Dio that speaks the ClassiAds API envelope
/// `{ success, data, message, meta, errors }` and normalizes errors.
class ApiClient {
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {'Accept': 'application/json'},
      // We handle non-2xx ourselves to read the envelope.
      validateStatus: (_) => true,
    ));
  }

  late final Dio _dio;

  /// Bearer = the signed-in Firebase user's ID token (refreshed automatically by the SDK).
  Future<Options> _options() async {
    final token = await fb.FirebaseAuth.instance.currentUser?.getIdToken();
    return Options(headers: token != null ? {'Authorization': 'Bearer $token'} : null);
  }

  Future<ApiResult> get(String path, {Map<String, dynamic>? query}) =>
      _request((o) => _dio.get(path, queryParameters: query, options: o));

  Future<ApiResult> post(String path, {Object? body}) =>
      _request((o) => _dio.post(path, data: body, options: o));

  Future<ApiResult> put(String path, {Object? body}) =>
      _request((o) => _dio.put(path, data: body, options: o));

  Future<ApiResult> delete(String path, {Object? body}) =>
      _request((o) => _dio.delete(path, data: body, options: o));

  /// Multipart upload (images, KYC docs).
  Future<ApiResult> upload(String path, FormData form) =>
      _request((o) => _dio.post(path, data: form, options: o));

  /// Multipart PUT (e.g. profile update with an avatar file).
  Future<ApiResult> putMultipart(String path, FormData form) =>
      _request((o) => _dio.put(path, data: form, options: o));

  Future<ApiResult> _request(Future<Response> Function(Options options) send) async {
    final Response res;
    try {
      res = await send(await _options());
    } on DioException catch (e) {
      throw ApiException(
        e.type == DioExceptionType.connectionError ||
                e.type == DioExceptionType.connectionTimeout
            ? 'Cannot reach the server. Is the API running?'
            : (e.message ?? 'Network error.'),
      );
    }

    final status = res.statusCode ?? 0;
    final body = res.data;

    if (body is! Map) {
      if (status >= 200 && status < 300) return ApiResult(body, '', null);
      throw ApiException('Unexpected response (HTTP $status).', statusCode: status);
    }

    final map = body.cast<String, dynamic>();
    final success = map['success'] == true && status >= 200 && status < 300;

    if (success) {
      return ApiResult(
        map['data'],
        (map['message'] as String?) ?? '',
        (map['meta'] as Map?)?.cast<String, dynamic>(),
      );
    }

    Map<String, List<String>>? errors;
    final rawErrors = map['errors'];
    if (rawErrors is Map) {
      errors = rawErrors.map((k, v) => MapEntry(
            k.toString(),
            (v is List) ? v.map((e) => e.toString()).toList() : [v.toString()],
          ));
    }

    throw ApiException(
      (map['message'] as String?) ?? 'Request failed.',
      statusCode: status,
      errors: errors,
    );
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
