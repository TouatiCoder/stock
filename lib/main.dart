import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:buildstock_pro/providers/auth_provider.dart';
import 'package:buildstock_pro/screens/auth/login_screen.dart';
import 'package:buildstock_pro/screens/dashboard/dashboard_screen.dart';
import 'package:buildstock_pro/theme/app_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'BuildStock Pro',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            if (authProvider.isAuthenticated) {
              return const DashboardScreen();
            }
            return const LoginScreen();
          },
        ),
      ),
    );
  }
}
