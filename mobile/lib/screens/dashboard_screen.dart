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

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);
    final businessesAsync = ref.watch(businessesProvider);
    final currentBusiness = ref.watch(currentBusinessProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Inicializar el negocio actual si no está seteado
    ref.listen(businessesProvider, (previous, next) {
      if (next.hasValue && currentBusiness == null) {
        ref.read(currentBusinessProvider.notifier).init(next.value!);
      }
    });

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: dashboardAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
        data: (metrics) {
          final lowStock = metrics['low_stock'] as List<dynamic>? ?? [];

          return RefreshIndicator(
            onRefresh: () async {
              ref.refresh(dashboardProvider);
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

  Widget _buildHeaderCard(Map<String, dynamic> metrics, bool isDark, BuildContext context, WidgetRef ref) {
    final currentBusiness = ref.watch(currentBusinessProvider);
    final businessName = currentBusiness?['name'] ?? 'Mi Negocio';

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Fondo de branding (Azul/Índigo)
        Container(
          height: 220,
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CircleAvatar(
                backgroundColor: Colors.white,
                radius: 20,
                child: Icon(PhosphorIconsRegular.storefront, color: Color(0xFF3B82F6)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => _showBusinessSelector(context, ref),
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(
                              businessName.toUpperCase(), 
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(PhosphorIconsRegular.caretDown, color: Colors.white),
                        ],
                      ),
                    ),
                    Text('Propietario', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                  ],
                ),
              ),
              const Icon(PhosphorIconsRegular.question, color: Colors.white),
            ],
          ),
        ),
        
        // Tarjeta blanca superpuesta
        Container(
          margin: const EdgeInsets.only(top: 130, left: 16, right: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Rendimiento', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: isDark ? Colors.white : Colors.black87)),
                  _buildTimeFilterDropdown(ref),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '\$${(metrics['total_sales'] ?? 0).toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(PhosphorIconsRegular.arrowUp, color: Colors.green, size: 14),
                        SizedBox(width: 4),
                        Text('Ventas', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                  )
                ],
              ),
              Text('Ventas totales', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
              
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
              ),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '\$${(metrics['total_profit'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green),
                      ),
                      Text('Ganancia', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '\$${(metrics['total_expenses'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      Text('Gastos hoy', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Acción para registrar venta -> ir a POS (index 2)
                    ref.read(navigationIndexProvider.notifier).state = 2;
                  },
                  icon: const Icon(PhosphorIconsRegular.shoppingCart, color: Colors.white),
                  label: const Text('Registrar venta', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFF1E293B),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              )
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
          const Text(
            'Descubre todo lo que puedes hacer',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _actionCard('Estadísticas', PhosphorIconsRegular.chartPie, Colors.green, isDark, onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const StatisticsScreen()));
                }),
                _actionCard('Clientes', PhosphorIconsRegular.users, Colors.amber, isDark, onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.customers)));
                }),
                _actionCard('Proveedores', PhosphorIconsRegular.truck, Colors.blue, isDark, onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const EntityListScreen(entityType: EntityType.suppliers)));
                }),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _actionCard(String title, IconData icon, Color color, bool isDark, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLowStockSection(List<dynamic> lowStock, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(PhosphorIconsRegular.warning, color: Colors.redAccent, size: 20),
              SizedBox(width: 8),
              Text(
                'Próximos a agotarse',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (lowStock.isEmpty)
            const Text('Todo el stock está bien.', style: TextStyle(color: Colors.grey)),
          ...lowStock.map((item) {
            final stock = item['stock'] as int;
            final isOut = stock == 0;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isOut ? Colors.redAccent.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isOut ? Colors.redAccent.withOpacity(0.3) : Colors.amber.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(PhosphorIconsRegular.warning, size: 14, color: isOut ? Colors.red : Colors.orange),
                      const SizedBox(width: 4),
                      Text(
                        'Stock crítico',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isOut ? Colors.red : Colors.orange,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item['name'] ?? 'Desconocido',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Stock: $stock unidades', style: const TextStyle(fontWeight: FontWeight.w500)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isOut ? Colors.red : Colors.amber,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isOut ? '🔴 AGOTADO' : '⚠ BAJO STOCK',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: isOut ? Colors.white : Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            );
          }).toList(),
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
                            leading: const Icon(PhosphorIconsRegular.plusCircle, color: Colors.blue),
                            title: const Text('Crear nuevo negocio', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
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
                          trailing: isSelected ? const Icon(PhosphorIconsRegular.check, color: Colors.blue) : null,
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

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Nuevo Negocio'),
            content: TextField(
              controller: controller,
              decoration: const InputDecoration(hintText: 'Nombre del negocio', border: OutlineInputBorder()),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: isSaving ? null : () async {
                  if (controller.text.trim().isEmpty) return;
                  setState(() => isSaving = true);
                  try {
                    final res = await apiClient.post('/businesses/', data: {"name": controller.text.trim()});
                    ref.invalidate(businessesProvider);
                    
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Negocio creado')));
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  } finally {
                    if (context.mounted) setState(() => isSaving = false);
                  }
                },
                child: isSaving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text('Crear'),
              ),
            ],
          );
        }
      ),
    );
  }

  Widget _buildTimeFilterDropdown(WidgetRef ref) {
    final currentFilter = ref.watch(dashboardTimeFilterProvider);
    
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
          color: Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(getLabel(currentFilter), style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(width: 4),
            const Icon(PhosphorIconsRegular.caretDown, color: Colors.blue, size: 14),
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
