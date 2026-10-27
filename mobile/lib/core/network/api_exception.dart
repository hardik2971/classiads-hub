/// Normalized API error surfaced to the UI layer.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.errors});

  final String message;
  final int? statusCode;

  /// Field validation errors: { field: [messages] }
  final Map<String, List<String>>? errors;

  /// First validation message for a given field, if any.
  String? firstErrorFor(String field) {
    final list = errors?[field];
    return (list != null && list.isNotEmpty) ? list.first : null;
  }

  bool get isUnauthorized => statusCode == 401;
  bool get isValidation => statusCode == 422;

  @override
  String toString() => message;
}
