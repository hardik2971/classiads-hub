class Category {
  Category({
    required this.id,
    this.parentId,
    required this.name,
    required this.slug,
    this.iconPath,
    this.type = 'standard',
    this.adsCount = 0,
    this.children = const [],
    this.customFields = const [],
  });

  final int id;
  final int? parentId;
  final String name;
  final String slug;
  final String? iconPath;
  final String type;
  final int adsCount;
  final List<Category> children;
  final List<CustomField> customFields;

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: (j['id'] as num).toInt(),
        parentId: (j['parent_id'] as num?)?.toInt(),
        name: j['name'] as String? ?? '',
        slug: j['slug'] as String? ?? '',
        iconPath: j['icon_path'] as String?,
        type: j['type'] as String? ?? 'standard',
        adsCount: (j['ads_count'] as num?)?.toInt() ?? 0,
        children: (j['children'] as List?)
                ?.map((e) => Category.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        customFields: (j['custom_fields'] as List?)
                ?.map((e) => CustomField.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );
}

class CustomFieldOption {
  CustomFieldOption({required this.label, required this.value});
  final String label;
  final String value;

  /// Options may be `{label, value}` maps (values not always strings) or bare strings.
  factory CustomFieldOption.fromJson(Object? j) {
    if (j is Map) {
      final value = (j['value'] ?? j['label'])?.toString() ?? '';
      return CustomFieldOption(label: (j['label'] ?? value).toString(), value: value);
    }
    final v = j?.toString() ?? '';
    return CustomFieldOption(label: v, value: v);
  }
}

class CustomField {
  CustomField({
    required this.id,
    required this.name,
    required this.code,
    required this.type,
    this.isRequired = false,
    this.options = const [],
  });

  final int id;
  final String name;
  final String code;
  final String type;
  final bool isRequired;
  final List<CustomFieldOption> options;

  bool get hasOptions => type == 'dropdown' || type == 'radio' || type == 'checkbox';

  factory CustomField.fromJson(Map<String, dynamic> j) => CustomField(
        id: (j['id'] as num).toInt(),
        name: j['name'] as String? ?? '',
        code: j['code'] as String? ?? '',
        type: j['type'] as String? ?? 'text',
        isRequired: j['is_required'] == true,
        options: (j['options'] as List?)
                ?.map(CustomFieldOption.fromJson)
                .toList() ??
            const [],
      );
}
