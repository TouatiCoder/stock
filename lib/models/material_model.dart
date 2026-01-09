class StockMaterial {
  final String id;
  final String name;
  final String category;
  final double quantity;
  final double minThreshold;
  final double price;
  final String unit;
  final DateTime lastUpdated;

  StockMaterial({
    required this.id,
    required this.name,
    required this.category,
    required this.quantity,
    required this.minThreshold,
    required this.price,
    required this.unit,
    required this.lastUpdated,
  });

  bool get isCritical => quantity <= minThreshold;

  factory StockMaterial.fromJson(Map<String, dynamic> json) {
    return StockMaterial(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      quantity: (json['quantity'] ?? 0).toDouble(),
      minThreshold: (json['minThreshold'] ?? 0).toDouble(),
      price: (json['price'] ?? 0).toDouble(),
      unit: json['unit'] ?? 'kg',
      lastUpdated: DateTime.tryParse(json['lastUpdated'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'quantity': quantity,
      'minThreshold': minThreshold,
      'price': price,
      'unit': unit,
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }
}
