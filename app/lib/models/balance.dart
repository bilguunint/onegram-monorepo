class Balance {
  final num gold;
  final int saving;
  final num silver;

  const Balance({
    required this.gold,
    required this.saving,
    required this.silver,
  });

  factory Balance.fromMap(Map<String, dynamic> map) {
    return Balance(
      gold: map['gold'] ?? 0,
      saving: map['saving'] ?? 0,
      silver: map['silver'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'gold': gold,
      'saving': saving,
      'silver': silver,
    };
  }
}