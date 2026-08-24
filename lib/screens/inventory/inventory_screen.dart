import 'package:flutter/material.dart';
import 'package:buildstock_pro/models/material_model.dart';
import 'package:buildstock_pro/theme/app_theme.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({Key? key}) : super(key: key);

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'Tous';

  final List<StockMaterial> _materials = [
    StockMaterial(
      id: '1',
      name: 'Ciment Portland',
      category: 'Ciment',
      quantity: 50,
      minThreshold: 100,
      price: 15.50,
      unit: 'tonnes',
      lastUpdated: DateTime.now(),
    ),
    StockMaterial(
      id: '2',
      name: 'Acier renforcé',
      category: 'Acier',
      quantity: 200,
      minThreshold: 150,
      price: 500.00,
      unit: 'tonnes',
      lastUpdated: DateTime.now(),
    ),
    StockMaterial(
      id: '3',
      name: 'Sable calibré',
      category: 'Agrégats',
      quantity: 300,
      minThreshold: 250,
      price: 25.00,
      unit: 'm³',
      lastUpdated: DateTime.now(),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filteredMaterials = _materials.where((m) {
      return (_selectedCategory == 'Tous' || m.category == _selectedCategory) &&
          m.name.toLowerCase().contains(_searchController.text.toLowerCase());
    }).toList();

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Rechercher un matériau',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
              ),
              onChanged: (_) {
                setState(() {});
              },
            ),
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Tous', 'Ciment', 'Acier', 'Agrégats']
                    .map((category) => Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(category),
                            selected: _selectedCategory == category,
                            onSelected: (_) {
                              setState(() {
                                _selectedCategory = category;
                              });
                            },
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Matériaux Critiques',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ..._materials
                .where((m) => m.isCritical)
                .map((material) => _MaterialTile(material: material)),
            const SizedBox(height: 16),
            Text(
              'Tous les matériaux',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ...filteredMaterials.map((material) => _MaterialTile(material: material)),
          ],
        ),
      ),
    );
  }
}

class _MaterialTile extends StatelessWidget {
  final StockMaterial  material;

  const _MaterialTile({required this.material});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(material.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(
                        '${material.quantity} ${material.unit}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                if (material.isCritical)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Critique',
                      style: TextStyle(color: AppTheme.errorColor, fontSize: 12),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: material.quantity / material.minThreshold,
              minHeight: 6,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${material.price.toStringAsFixed(2)} €',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Seuil: ${material.minThreshold} ${material.unit}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
