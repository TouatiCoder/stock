import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:buildstock_pro/providers/auth_provider.dart';
import 'package:buildstock_pro/theme/app_theme.dart';
import 'package:buildstock_pro/screens/inventory/inventory_screen.dart';
import 'package:buildstock_pro/screens/projects/projects_screen.dart';
import 'package:buildstock_pro/screens/costs/costs_screen.dart';
import 'package:buildstock_pro/screens/settings/settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    AdminDashboard(),
    InventoryScreen(),
    ProjectsScreen(),
    CostsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('BuildStock Pro'),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Center(
              child: Text(
                user?.name ?? 'Utilisateur',
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              PopupMenuItem(
                child: const Text('Déconnexion'),
                onTap: () {
                  context.read<AuthProvider>().logout();
                },
              ),
            ],
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Tableau de bord',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2),
            label: 'Stock',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder),
            label: 'Projets',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.money),
            label: 'Coûts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Paramètres',
          ),
        ],
      ),
    );
  }
}

class AdminDashboard extends StatelessWidget {
  const AdminDashboard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tableau de bord',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _KPICard(
                  title: 'Budget Total',
                  value: '50 000 €',
                  icon: Icons.account_balance,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _KPICard(
                  title: 'Dépensé',
                  value: '22 500 €',
                  icon: Icons.trending_down,
                  color: AppTheme.warningColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _KPICard(
                  title: 'Projets',
                  value: '8',
                  icon: Icons.folder,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _KPICard(
                  title: 'Stock Critique',
                  value: '3',
                  icon: Icons.warning,
                  color: AppTheme.errorColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Alertes Urgentes',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.errorColor.withOpacity(0.1),
              border: Border.all(color: AppTheme.errorColor),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.error, color: AppTheme.errorColor),
                SizedBox(width: 8),
                Expanded(
                  child: Text('Ciment Portland : 50 tonnes (seuil: 100 tonnes)'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _KPICard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color? color;

  const _KPICard({
    required this.title,
    required this.value,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color ?? AppTheme.primaryColor),
            const SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
