import 'package:equatable/equatable.dart';

class NewsItem extends Equatable {
  final String id;
  final String title;
  final String body;
  final String titleMn;
  final String summaryMn;
  final String imageUrl;
  final String url;
  final DateTime? publishedAt;
  final String sourceName;
  final String sourceUrl;
  final String sourceFullname;
  final String sourceCountry;
  final List<String> categories;
  final DateTime? createdAt;

  // 🆕 New fields:
  final Map<String, dynamic> category;
  final Map<String, dynamic> subCategory;
  final List<String> hashtags;

  const NewsItem({
    required this.id,
    required this.title,
    required this.body,
    required this.titleMn,
    required this.summaryMn,
    required this.imageUrl,
    required this.url,
    required this.publishedAt,
    required this.sourceName,
    required this.sourceUrl,
    required this.sourceFullname,
    required this.sourceCountry,
    required this.categories,
    required this.createdAt,
    required this.category,
    required this.subCategory,
    required this.hashtags,
  });

  factory NewsItem.fromMap(String id, Map<String, dynamic> data) {
    return NewsItem(
      id: id,
      title: data['title'] ?? '',
      body: data['body'] ?? '',
      titleMn: data['title_mn'] ?? '',
      summaryMn: data['summary_mn'] ?? '',
      imageUrl: data['image'] ?? '',
      url: data['url'] ?? '',
      publishedAt: _parseDateTime(data['publishedAt']),
      sourceName: data['source_name'] ?? '',
      sourceUrl: data['source_url'] ?? '',
      sourceFullname: data['source_fullname'] ?? '',
      sourceCountry: data['source_country'] ?? '',
      categories: List<String>.from(data['categories'] ?? []),
      createdAt: _parseDateTime(data['created_at'] ?? data['createdAt']),
      category: Map<String, dynamic>.from(data['category'] ?? {}),
      subCategory: Map<String, dynamic>.from(data['sub_category'] ?? {}),
      hashtags: List<String>.from(data['hashtags'] ?? []),
    );
  }

  // Helper method to parse DateTime from various formats (String, Timestamp, etc.)
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    
    // If it's already a DateTime
    if (value is DateTime) return value;
    
    // If it's a Firestore Timestamp
    if (value.runtimeType.toString() == 'Timestamp') {
      return (value as dynamic).toDate();
    }
    
    // If it's a String, try to parse it
    if (value is String) {
      if (value.isEmpty) return null;
      return DateTime.tryParse(value);
    }
    
    // If it's a Map (sometimes Firestore returns timestamp as map)
    if (value is Map) {
      final seconds = value['_seconds'] ?? value['seconds'];
      final nanoseconds = value['_nanoseconds'] ?? value['nanoseconds'] ?? 0;
      if (seconds != null) {
        return DateTime.fromMillisecondsSinceEpoch(
          (seconds * 1000) + (nanoseconds / 1000000).round(),
        );
      }
    }
    
    // Fallback
    return DateTime.now();
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'body': body,
      'title_mn': titleMn,
      'summary_mn': summaryMn,
      'image': imageUrl,
      'url': url,
      'publishedAt': publishedAt!.toIso8601String(),
      'source_name': sourceName,
      'source_url': sourceUrl,
      'source_fullname': sourceFullname,
      'source_country': sourceCountry,
      'categories': categories,
      'createdAt': createdAt!.toIso8601String(),
      'category': category,
      'sub_category': subCategory,
      'hashtags': hashtags,
    };
  }

  /// 🔹 Empty constant for default state
  static const empty = NewsItem(
    id: '',
    title: '',
    body: '',
    titleMn: '',
    summaryMn: '',
    imageUrl: '',
    url: '',
    publishedAt: null,
    sourceName: '',
    sourceUrl: '',
    sourceFullname: '',
    sourceCountry: '',
    categories: [],
    createdAt: null,
    category: {},
    subCategory: {},
    hashtags: [],
  );

  @override
  List<Object?> get props => [
        id,
        title,
        body,
        titleMn,
        summaryMn,
        imageUrl,
        url,
        publishedAt,
        sourceName,
        sourceUrl,
        sourceFullname,
        sourceCountry,
        categories,
        createdAt,
        category,
        subCategory,
        hashtags,
      ];
}
