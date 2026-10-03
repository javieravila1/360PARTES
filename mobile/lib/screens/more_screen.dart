import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import 'entity_list_screen.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Configuración', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
        children: [
          // User Profile Header Placeholder
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark 
                    ? [const Color(0xFF1E293B), const Color(0xFF334155)]
                    : [Colors.blue.shade600, Colors.blue.shade800],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: (isDark ? Colors.black : Colors.blue.shade200).withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: const Icon(PhosphorIconsRegular.user, size: 36, color: Colors.white),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Administrador',
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Gestiona tu negocio',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Section: Gestión de Contactos
          const Padding(
            padding: EdgeInsets.only(left: 8, bottom: 8),
            child: Text('CONTACTOS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
          ),
          _buildCardGroup(
            isDark: isDark,
            children: [
              _buildSettingsItem(
                context,
                icon: PhosphorIconsRegular.users,
                color: Colors.blue.shade500,
                title: 'Clientes',
                subtitle: 'Gestiona tu cartera de clientes',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.customers))),
              ),
              _buildDivider(isDark),
              _buildSettingsItem(
                context,
                icon: PhosphorIconsRegular.buildings,
                color: Colors.purple.shade500,
                title: 'Proveedores',
                subtitle: 'Administra tus proveedores',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.suppliers))),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Section: Catálogo
          const Padding(
            padding: EdgeInsets.only(left: 8, bottom: 8),
            child: Text('CATÁLOGO', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
          ),
          _buildCardGroup(
            isDark: isDark,
            children: [
              _buildSettingsItem(
                context,
                icon: PhosphorIconsRegular.tag,
                color: Colors.orange.shade500,
                title: 'Categorías',
                subtitle: 'Organiza tus productos',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.categories))),
              ),
              _buildDivider(isDark),
              _buildSettingsItem(
                context,
                icon: PhosphorIconsRegular.bookmarks,
                color: Colors.teal.shade500,
                title: 'Marcas',
                subtitle: 'Gestiona las marcas',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.brands))),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Section: Cuenta
          _buildCardGroup(
            isDark: isDark,
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(PhosphorIconsRegular.signOut, color: Colors.red),
                ),
                title: const Text('Cerrar Sesión', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                onTap: () => _showLogoutDialog(context, ref),
              ),
            ],
          ),
          
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCardGroup({required bool isDark, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSettingsItem(BuildContext context, {required IconData icon, required Color color, required String title, required String subtitle, required VoidCallback onTap}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
      trailing: Icon(PhosphorIconsRegular.caretRight, color: Colors.grey.shade400),
      onTap: onTap,
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(height: 1, indent: 70, color: isDark ? Colors.grey.shade800 : Colors.grey.shade100);
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro de que deseas cerrar sesión?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(c);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Cerrar Sesión'),
          ),
        ],
      )
    );
  }
}
