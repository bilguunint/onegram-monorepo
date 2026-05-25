class RateModel {
  final int id;
  final String type;
  final double rate;
  final double changePercent;

  RateModel({
    required this.id,
    required this.type,
    required this.rate,
    required this.changePercent,
  });

  factory RateModel.fromMap(Map<String, dynamic> map) {
    return RateModel(
      id: map['id'] ?? 0,
      type: map['type'] ?? '',
      rate: (map['rate'] as num).toDouble(),
      changePercent: (map['changes'] as num).toDouble(),
    );
  }
}