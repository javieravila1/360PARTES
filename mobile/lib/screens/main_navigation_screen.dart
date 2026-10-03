import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'dashboard_screen.dart';
import 'inventory_screen.dart';
import 'pos_screen.dart';
import 'expenses_screen.dart';
import 'more_screen.dart';
import '../providers/navigation_provider.dart';

class MainNavigationScreen extends ConsumerWidget {
  const MainNavigationScreen({super.key});

  final List<Widget> _screens = const [
    const DashboardScreen(),
    const InventoryScreen(),
    const PosScreen(),
    const ExpensesScreen(),
    const MoreScreen(),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(navigationIndexProvider);

    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          ref.read(navigationIndexProvider.notifier).state = index;
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(PhosphorIconsRegular.house),
            selectedIcon: Icon(PhosphorIconsFill.house, color: Color(0xFF3B82F6)),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(PhosphorIconsRegular.package),
            selectedIcon: Icon(PhosphorIconsFill.package, color: Color(0xFF3B82F6)),
            label: 'Inventario',
          ),
          NavigationDestination(
            icon: Icon(PhosphorIconsRegular.shoppingCart),
            selectedIcon: Icon(PhosphorIconsFill.shoppingCart, color: Color(0xFF3B82F6)),
            label: 'Vender',
          ),
          NavigationDestination(
            icon: Icon(PhosphorIconsRegular.wallet),
            selectedIcon: Icon(PhosphorIconsFill.wallet, color: Color(0xFF3B82F6)),
            label: 'Gastos',
          ),
          NavigationDestination(
            icon: Icon(PhosphorIconsRegular.list),
            selectedIcon: Icon(PhosphorIconsFill.list, color: Color(0xFF3B82F6)),
            label: 'Más',
          ),
        ],
      ),
    );
  }
}
