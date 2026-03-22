class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? company;
  final String? phone;
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.company,
    this.phone,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'chef_chantier',
      company: json['company'],
      phone: json['phone'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'company': company,
      'phone': phone,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
