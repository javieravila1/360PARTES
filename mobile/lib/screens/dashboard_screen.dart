import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/dashboard_provider.dart';
import '../providers/businesses_provider.dart';
import '../providers/inventory_provider.dart';
import '../api/api_client.dart';

import '../providers/navigation_provider.dart';
import '../screens/entity_list_screen.dart';
import '../screens/statistics_screen.dart';
import '../widgets/form_widgets.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentBusiness = ref.watch(currentBusinessProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Inicializar el negocio actual si no está seteado
    ref.listen(businessesProvider, (previous, next) {
      if (next.hasValue && ref.read(currentBusinessProvider) == null) {
        ref.read(currentBusinessProvider.notifier).init(next.value!);
      }
    });

    // Si no hay negocio seleccionado, mostrar cargando y forzar inicialización
    if (currentBusiness == null) {
      final businessesAsync = ref.watch(businessesProvider);
      return Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        body: businessesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, s) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(PhosphorIconsRegular.warning, size: 48, color: Color(0xFFB45309)),
                const SizedBox(height: 12),
                Text('Error al cargar negocios', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(businessesProvider),
                  child: const Text('Reintentar'),
                ),
              ],
            ),
          ),
          data: (businesses) {
            // Forzar inicialización si aún no se ha hecho
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (ref.read(currentBusinessProvider) == null && businesses.isNotEmpty) {
                ref.read(currentBusinessProvider.notifier).init(businesses);
              }
            });
            return const Center(child: CircularProgressIndicator());
          },
        ),
      );
    }

    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: dashboardAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(PhosphorIconsRegular.warning, size: 48, color: Color(0xFFB45309)),
              const SizedBox(height: 12),
              Text('Error al cargar el dashboard', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text('$error', style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), fontSize: 12), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(dashboardProvider),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        data: (metrics) {
          final lowStock = metrics['low_stock'] as List<dynamic>? ?? [];

          return RefreshIndicator(
            onRefresh: () async {
              return await ref.refresh(dashboardProvider.future);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderCard(metrics, isDark, context, ref),
                  const SizedBox(height: 24),
                  _buildQuickActions(isDark, context),
                  const SizedBox(height: 24),
                  _buildLowStockSection(lowStock, isDark),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _sectionTitle(String text, {Widget? trailing}) {
    return Row(
      children: [
        Text(text, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
        const Spacer(),
        trailing ?? const SizedBox.shrink(),
      ],
    );
  }

  Widget _buildHeaderCard(Map<String, dynamic> metrics, bool isDark, BuildContext context, WidgetRef ref) {
    final currentBusiness = ref.watch(currentBusinessProvider);
    final businessName = currentBusiness?['name'] ?? 'Mi Negocio';
    final borderColor = isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0);
    final cardColor = isDark ? const Color(0xFF111827) : Colors.white;
    final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 250,
          width: double.infinity,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF111827) : const Color(0xFF1E293B),
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
          ),
          child: Padding(
            padding: const EdgeInsets.only(top: 64, left: 24, right: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Negocio', style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1.2)),
                      const SizedBox(height: 6),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => _showBusinessSelector(context, ref),
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                businessName,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28, letterSpacing: -0.8),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(PhosphorIconsBold.caretDown, color: Colors.white.withValues(alpha: 0.7), size: 16),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(PhosphorIconsRegular.bell, color: Colors.white.withValues(alpha: 0.85)),
                  onPressed: () {},
                ),
              ],
            ),
          ),
        ),

        // Tarjeta de métricas
        Container(
          margin: const EdgeInsets.only(top: 148, left: 16, right: 16),
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: borderColor),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 16, offset: const Offset(0, 6))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Ventas totales', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: muted)),
                  _buildTimeFilterDropdown(ref),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '\$${(metrics['total_sales'] as num? ?? 0).toStringAsFixed(0)}',
                style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF0F172A), letterSpacing: -1.5),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 18),
                child: Divider(color: borderColor, height: 1),
              ),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Ganancia neta', style: TextStyle(color: muted, fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('\$${(metrics['total_profit'] as num? ?? 0).toStringAsFixed(0)}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Color(0xFF059669), letterSpacing: -0.5)),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 36, color: borderColor),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Gastos', style: TextStyle(color: muted, fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('\$${(metrics['total_expenses'] as num? ?? 0).toStringAsFixed(0)}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Color(0xFFB91C1C), letterSpacing: -0.5)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => ref.read(navigationIndexProvider.notifier).state = 2,
                  icon: const Icon(PhosphorIconsBold.shoppingCart, size: 18),
                  label: const Text('Registrar nueva venta'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(bool isDark, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Accesos rápidos'),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _actionCard('Estadísticas', PhosphorIconsRegular.chartPieSlice, isDark, onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const StatisticsScreen()));
              })),
              const SizedBox(width: 12),
              Expanded(child: _actionCard('Clientes', PhosphorIconsRegular.users, isDark, onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.customers)));
              })),
              const SizedBox(width: 12),
              Expanded(child: _actionCard('Proveedores', PhosphorIconsRegular.truck, isDark, onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.suppliers)));
              })),
            ],
          ),
        ],
      ),
    );
  }

  Widget _actionCard(String title, IconData icon, bool isDark, {required VoidCallback onTap}) {
    return Material(
      color: isDark ? const Color(0xFF111827) : Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155), size: 24),
              ),
              const SizedBox(height: 10),
              Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLowStockSection(List<dynamic> lowStock, bool isDark) {
    final borderColor = isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0);
    final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Próximos a agotarse'),
          const SizedBox(height: 14),
          if (lowStock.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111827) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  const Icon(PhosphorIconsRegular.checkCircle, color: Color(0xFF059669)),
                  const SizedBox(width: 12),
                  Text('Todo el stock está en orden.', style: TextStyle(color: muted, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ...lowStock.map((item) {
            final stock = ((item['stock'] as num?) ?? 0).toInt();
            final isOut = stock == 0;
            final accent = isOut ? const Color(0xFFB91C1C) : const Color(0xFFB45309);
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111827) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 40,
                    decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['name'] ?? 'Desconocido', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                        const SizedBox(height: 2),
                        Text('$stock unidades restantes', style: TextStyle(color: muted, fontSize: 13)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(isOut ? 'Agotado' : 'Stock bajo', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: accent)),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showBusinessSelector(BuildContext context, WidgetRef ref) {
    final businessesAsync = ref.read(businessesProvider);
    final currentBusiness = ref.read(currentBusinessProvider);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          height: 400,
          child: Column(
            children: [
              const Text('Cambiar de Negocio', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: businessesAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Center(child: Text('Error: $err')),
                  data: (businesses) {
                    return ListView.builder(
                      itemCount: businesses.length + 1,
                      itemBuilder: (context, index) {
                        if (index == businesses.length) {
                          return ListTile(
                            leading: const Icon(PhosphorIconsRegular.plusCircle),
                            title: const Text('Crear nuevo negocio', style: TextStyle(fontWeight: FontWeight.bold)),
                            onTap: () {
                              Navigator.pop(context);
                              _showCreateBusinessDialog(context, ref);
                            },
                          );
                        }
                        final b = businesses[index]['business'];
                        final isSelected = currentBusiness?['id'] == b['id'];
                        return ListTile(
                          leading: const Icon(PhosphorIconsRegular.storefront),
                          title: Text(b['name'], style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                          trailing: isSelected ? const Icon(PhosphorIconsBold.check) : null,
                          onTap: () async {
                            Navigator.pop(context);
                            await ref.read(currentBusinessProvider.notifier).setBusiness(b['id'].toString(), b);
                            ref.invalidate(dashboardProvider); // Refresca métricas
                            ref.invalidate(inventoryProvider); // Refresca inventario
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showCreateBusinessDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();
    bool isSaving = false;

    showFormSheet(
      context: context,
      title: 'Nuevo Negocio',
      builder: (c, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppField(
              label: 'Nombre del negocio',
              controller: controller,
              required: true,
              icon: PhosphorIconsRegular.storefront,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Crear',
              loading: isSaving,
              onPressed: () async {
                if (controller.text.trim().isEmpty) return;
                setState(() => isSaving = true);
                try {
                  await apiClient.post('/businesses/', data: {"name": controller.text.trim()});
                  ref.invalidate(businessesProvider);
                  
                  if (c.mounted) {
                    Navigator.pop(c);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Negocio creado')));
                  }
                } catch (e) {
                  if (c.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                } finally {
                  if (c.mounted) setState(() => isSaving = false);
                }
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildTimeFilterDropdown(WidgetRef ref) {
    final currentFilter = ref.read(dashboardTimeFilterProvider);
    
    String getLabel(String val) {
      switch (val) {
        case 'today': return 'Hoy';
        case 'this_week': return 'Semana';
        case 'this_month': return 'Mes';
        case 'this_semester': return 'Semestre';
        case 'this_year': return 'Año';
        case 'all_time': return 'Todo';
        default: return 'Hoy';
      }
    }

    return PopupMenuButton<String>(
      onSelected: (val) => ref.read(dashboardTimeFilterProvider.notifier).state = val,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF64748B).withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(getLabel(currentFilter), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(width: 4),
            const Icon(PhosphorIconsRegular.caretDown, size: 14),
          ],
        ),
      ),
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'today', child: Text('Hoy')),
        PopupMenuItem(value: 'this_week', child: Text('Esta Semana')),
        PopupMenuItem(value: 'this_month', child: Text('Este Mes')),
        PopupMenuItem(value: 'this_semester', child: Text('Este Semestre')),
        PopupMenuItem(value: 'this_year', child: Text('Este Año')),
        PopupMenuItem(value: 'all_time', child: Text('Todo el Tiempo')),
      ],
    );
  }
}
