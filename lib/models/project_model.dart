class Project {
  final String id;
  final String name;
  final String description;
  final double budget;
  final double spent;
  final String status;
  final DateTime startDate;
  final DateTime? endDate;
  final List<String> materials;

  Project({
    required this.id,
    required this.name,
    required this.description,
    required this.budget,
    required this.spent,
    required this.status,
    required this.startDate,
    this.endDate,
    required this.materials,
  });

  double get progress => (spent / budget) * 100;
  bool get isBudgetExceeded => spent > budget;

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      budget: (json['budget'] ?? 0).toDouble(),
      spent: (json['spent'] ?? 0).toDouble(),
      status: json['status'] ?? 'en_cours',
      startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate']) : null,
      materials: List<String>.from(json['materials'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'budget': budget,
      'spent': spent,
      'status': status,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'materials': materials,
    };
  }
}
