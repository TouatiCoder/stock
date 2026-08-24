import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:buildstock_pro/providers/auth_provider.dart';
import 'package:buildstock_pro/theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Paramètres',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 24),
          Text(
            'Mon Compte',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nom: ${user?.name}'),
                  const SizedBox(height: 8),
                  Text('Email: ${user?.email}'),
                  const SizedBox(height: 8),
                  Text('Rôle: ${user?.role == 'admin' ? 'Administrateur' : user?.role == 'chef_chantier' ? 'Chef de Chantier' : 'Ingénieur'}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Sécurité',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ListTile(
            title: const Text('Changer le mot de passe'),
            trailing: const Icon(Icons.arrow_forward),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Fonctionnalité à implémenter')),
              );
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              context.read<AuthProvider>().logout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('Déconnexion'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
        ],
      ),
    );
  }
}
