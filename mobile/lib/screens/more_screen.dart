import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/businesses_provider.dart';
import 'entity_list_screen.dart';
import 'sales_history_screen.dart';
import 'statistics_screen.dart';
import '../widgets/form_widgets.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final business = ref.watch(currentBusinessProvider);
    final businessName = business?['name'] ?? 'Mi Negocio';

    void open(Widget w) => Navigator.push(context, MaterialPageRoute(builder: (_) => w));

    return Scaffold(
      appBar: AppBar(title: const Text('Más')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111827) : const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(22),
              border: isDark ? Border.all(color: const Color(0xFF273244)) : null,
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Image.asset('lib/public/image.png', width: 52, height: 52, fit: BoxFit.cover),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(businessName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
                      const SizedBox(height: 2),
                      Text('Administrador', style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          _sectionLabel('REPORTES', muted),
          _buildCardGroup(isDark: isDark, children: [
            _item(context, isDark, icon: PhosphorIconsRegular.chartPieSlice, title: 'Estadísticas', subtitle: 'Resumen y análisis de tu negocio', onTap: () => open(const StatisticsScreen())),
            _divider(isDark),
            _item(context, isDark, icon: PhosphorIconsRegular.receipt, title: 'Historial de ventas', subtitle: 'Consulta ventas realizadas', onTap: () => open(const SalesHistoryScreen())),
          ]),
          const SizedBox(height: 24),
          _sectionLabel('CONTACTOS', muted),
          _buildCardGroup(isDark: isDark, children: [
            _item(context, isDark, icon: PhosphorIconsRegular.users, title: 'Clientes', subtitle: 'Gestiona tu cartera de clientes', onTap: () => open(const EntityListScreen(entityType: EntityType.customers))),
            _divider(isDark),
            _item(context, isDark, icon: PhosphorIconsRegular.truck, title: 'Proveedores', subtitle: 'Administra tus proveedores', onTap: () => open(const EntityListScreen(entityType: EntityType.suppliers))),
          ]),
          const SizedBox(height: 24),
          _sectionLabel('CATÁLOGO', muted),
          _buildCardGroup(isDark: isDark, children: [
            _item(context, isDark, icon: PhosphorIconsRegular.tag, title: 'Categorías', subtitle: 'Organiza tus productos', onTap: () => open(const EntityListScreen(entityType: EntityType.categories))),
            _divider(isDark),
            _item(context, isDark, icon: PhosphorIconsRegular.bookmarks, title: 'Marcas', subtitle: 'Gestiona las marcas', onTap: () => open(const EntityListScreen(entityType: EntityType.brands))),
          ]),
          const SizedBox(height: 24),
          _buildCardGroup(isDark: isDark, children: [
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFB91C1C).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(PhosphorIconsRegular.signOut, color: Color(0xFFB91C1C), size: 20),
              ),
              title: const Text('Cerrar sesión', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFFB91C1C))),
              onTap: () => _showLogoutDialog(context, ref),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text, Color muted) => Padding(
        padding: const EdgeInsets.only(left: 6, bottom: 10),
        child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: muted, letterSpacing: 1.3)),
      );

  Widget _buildCardGroup({required bool isDark, required List<Widget> children}) {
    return Material(
      color: isDark ? const Color(0xFF111827) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }

  Widget _item(BuildContext context, bool isDark, {required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 20, color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155)),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: muted)),
      trailing: Icon(PhosphorIconsRegular.caretRight, size: 18, color: muted),
      onTap: onTap,
    );
  }

  Widget _divider(bool isDark) => Divider(height: 1, indent: 70, color: isDark ? const Color(0xFF273244) : const Color(0xFFF1F5F9));

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showFormSheet(
      context: context,
      title: 'Cerrar sesión',
      subtitle: '¿Estás seguro de que deseas cerrar sesión?',
      builder: (c, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppButton(
              label: 'Cerrar sesión',
              onPressed: () {
                Navigator.pop(c);
                ref.read(authProvider.notifier).logout();
              },
              icon: PhosphorIconsRegular.signOut,
              color: FormColors.danger,
            ),
          ],
        );
      },
    );
  }
}
