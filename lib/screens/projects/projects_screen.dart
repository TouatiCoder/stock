import 'package:flutter/material.dart';
import 'package:buildstock_pro/models/project_model.dart';
import 'package:buildstock_pro/theme/app_theme.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({Key? key}) : super(key: key);

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  final List<Project> _projects = [
    Project(
      id: '1',
      name: 'Centre commercial',
      description: 'Construction d\'un centre commercial',
      budget: 100000,
      spent: 45000,
      status: 'en_cours',
      startDate: DateTime(2024, 1, 15),
      materials: ['Ciment', 'Acier', 'Sable'],
    ),
    Project(
      id: '2',
      name: 'Immeuble résidentiel',
      description: 'Immeuble de 12 étages',
      budget: 200000,
      spent: 150000,
      status: 'en_cours',
      startDate: DateTime(2023, 9, 1),
      materials: ['Ciment', 'Acier'],
    ),
    Project(
      id: '3',
      name: 'Route départementale',
      description: 'Rénovation de la RD42',
      budget: 50000,
      spent: 50000,
      status: 'termine',
      startDate: DateTime(2023, 6, 1),
      materials: ['Asphalte', 'Gravier'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Projets',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            ..._projects.map((project) => _ProjectCard(project: project)),
          ],
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;

  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
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
                      Text(
                        project.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        project.description,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: project.status == 'termine'
                        ? AppTheme.successColor.withOpacity(0.2)
                        : AppTheme.primaryColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    project.status == 'termine' ? 'Terminé' : 'En cours',
                    style: TextStyle(
                      fontSize: 12,
                      color: project.status == 'termine' ? AppTheme.successColor : AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Budget: ${project.budget.toStringAsFixed(0)} €'),
                Text('Dépensé: ${project.spent.toStringAsFixed(0)} €'),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: project.progress / 100,
                minHeight: 8,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  project.isBudgetExceeded ? AppTheme.errorColor : AppTheme.primaryColor,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${project.progress.toStringAsFixed(1)}% du budget dépensé',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
