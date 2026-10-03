import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/inventory_provider.dart';
import '../providers/categories_provider.dart';
import '../providers/brands_provider.dart';
import '../api/api_client.dart';
import 'product_form_screen.dart';
import '../widgets/form_widgets.dart';
class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  String _searchQuery = '';
  String? _filterCategoryId;
  String? _filterBrandId;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildFilterChip(String title, String? selectedValue, AsyncValue<List<dynamic>> providerValue, Function(String) onSelected) {
    return ActionChip(
      label: Text(selectedValue == null ? title : '1 Seleccionado'),
      avatar: const Icon(PhosphorIconsRegular.caretDown),
      onPressed: () {
        showModalBottomSheet(
          context: context,
          builder: (context) {
            return providerValue.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, st) => const Center(child: Text('Error')),
              data: (items) => ListView.builder(
                itemCount: items.length,
                itemBuilder: (c, i) => ListTile(
                  title: Text(items[i]['name']),
                  onTap: () {
                    onSelected(items[i]['id'].toString());
                    Navigator.pop(context);
                  },
                ),
              ),
            );
          }
        );
      },
    );
  }

  void _showCreationOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('¿Qué deseas crear?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              ListTile(
                leading: const CircleAvatar(backgroundColor: Color(0xFF334155), child: Icon(PhosphorIconsRegular.package, color: Colors.white)),
                title: const Text('Nuevo Producto'),
                subtitle: const Text('Agregar un repuesto al inventario'),
                onTap: () {
                  Navigator.pop(ctx);
                  context.push('/product-form');
                },
              ),
              const Divider(),
              ListTile(
                leading: const CircleAvatar(backgroundColor: Color(0xFF475569), child: Icon(PhosphorIconsRegular.tag, color: Colors.white)),
                title: const Text('Nueva Categoría'),
                subtitle: const Text('Ej: Frenos, Motor, Eléctrico...'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showQuickCreateDialog('Categoría', '/categories/', categoriesProvider);
                },
              ),
              const Divider(),
              ListTile(
                leading: const CircleAvatar(backgroundColor: Color(0xFF64748B), child: Icon(PhosphorIconsRegular.bookmarks, color: Colors.white)),
                title: const Text('Nueva Marca'),
                subtitle: const Text('Ej: Toyota, Bosch, NGK...'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showQuickCreateDialog('Marca', '/brands/', brandsProvider);
                },
              ),
            ],
          ),
        );
      }
    );
  }

  void _showQuickCreateDialog(String entityName, String endpoint, AutoDisposeFutureProvider providerToRefresh) {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    bool isSaving = false;

    showFormSheet(
      context: context,
      title: 'Crear $entityName',
      builder: (c, setModalState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppField(
              label: 'Nombre',
              controller: nameCtrl,
              required: true,
            ),
            const SizedBox(height: 16),
            AppField(
              label: 'Descripción (Opcional)',
              controller: descCtrl,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Guardar',
              loading: isSaving,
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                setModalState(() => isSaving = true);
                try {
                  await apiClient.post(endpoint, data: {
                    "name": nameCtrl.text.trim(),
                    "description": descCtrl.text.trim()
                  });
                  ref.invalidate(providerToRefresh);
                  if (!c.mounted) return;
                  Navigator.pop(c);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$entityName creada')));
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                } finally {
                  if (mounted) setModalState(() => isSaving = false);
                }
              },
            ),
          ],
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Inventario', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.qrCode),
            tooltip: 'Escanear código',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Escáner de código de barras próximamente')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de Búsqueda
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.toLowerCase();
                });
              },
              decoration: InputDecoration(
                hintText: 'Buscar por nombre o SKU...',
                prefixIcon: const Icon(PhosphorIconsRegular.magnifyingGlass),
                suffixIcon: _searchQuery.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(PhosphorIconsRegular.x, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      ),
              ),
            ),
          ),

          // Filtros
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildFilterChip('Categoría', _filterCategoryId, ref.watch(categoriesProvider), (id) => setState(() => _filterCategoryId = id)),
                const SizedBox(width: 8),
                _buildFilterChip('Marca', _filterBrandId, ref.watch(brandsProvider), (id) => setState(() => _filterBrandId = id)),
                if (_filterCategoryId != null || _filterBrandId != null) ...[
                  const SizedBox(width: 8),
                  ActionChip(
                    label: const Text('Limpiar'),
                    onPressed: () => setState(() { _filterCategoryId = null; _filterBrandId = null; }),
                  )
                ]
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Lista de Productos
          Expanded(
            child: inventoryAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Text('Error: $error', style: const TextStyle(color: Colors.red)),
              ),
              data: (products) {
                // Filtrado local
                final filteredProducts = products.where((p) {
                  final name = (p['name'] ?? '').toString().toLowerCase();
                  final sku = (p['sku'] ?? '').toString().toLowerCase();
                  
                  final matchQuery = name.contains(_searchQuery) || sku.contains(_searchQuery);
                  final matchCat = _filterCategoryId == null || p['category_id']?.toString() == _filterCategoryId;
                  final matchBrand = _filterBrandId == null || p['brand_id']?.toString() == _filterBrandId;
                  
                  return matchQuery && matchCat && matchBrand;
                }).toList();

                if (filteredProducts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIconsRegular.package, size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        const Text('No se encontraron productos', style: TextStyle(fontSize: 16, color: Colors.grey)),
                        if (_filterCategoryId != null || _filterBrandId != null)
                          TextButton(
                            onPressed: () => setState(() { _filterCategoryId = null; _filterBrandId = null; }),
                            child: const Text('Borrar filtros'),
                          )
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(inventoryProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
                    itemCount: filteredProducts.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      final stock = product['current_stock'] ?? 0;
                      final isLowStock = stock <= 5;
                      final isOut = stock == 0;
                      final suggestedPrice = double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0;

                      return ClipRRect(
                       borderRadius: BorderRadius.circular(16),
                       child: Dismissible(
                        key: Key(product['id'].toString()),
                        background: Container(
                          color: const Color(0xFF475569),
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(PhosphorIconsRegular.plusCircle, color: Colors.white),
                        ),
                        secondaryBackground: Container(
                          color: const Color(0xFFB91C1C),
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(PhosphorIconsRegular.trash, color: Colors.white),
                        ),
                        confirmDismiss: (direction) async {
                          if (direction == DismissDirection.endToStart) {
                            return await showDialog(
                              context: context,
                              builder: (BuildContext context) {
                                return AlertDialog(
                                  title: const Text("Confirmar"),
                                  content: Text("¿Deseas eliminar '${product['name']}'?"),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(context).pop(false),
                                      child: const Text("CANCELAR"),
                                    ),
                                    TextButton(
                                      onPressed: () async {
                                        try {
                                          await apiClient.delete('/products/${product['id']}');
                                          ref.invalidate(inventoryProvider);
                                          if (context.mounted) Navigator.of(context).pop(true);
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                            Navigator.of(context).pop(false);
                                          }
                                        }
                                      },
                                      child: const Text("ELIMINAR", style: TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                );
                              },
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Agregar stock próximamente')),
                            );
                            return false;
                          }
                        },
                        child: Material(
                         color: isDark ? const Color(0xFF111827) : Colors.white,
                         shape: RoundedRectangleBorder(
                           borderRadius: BorderRadius.circular(16),
                           side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
                         ),
                         child: ListTile(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => ProductFormScreen(product: product)));
                          },
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: product['image_url'] != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(product['image_url'], fit: BoxFit.cover),
                                  )
                                : Icon(PhosphorIconsRegular.wrench, color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                          ),
                          title: Text(
                            product['name'] ?? 'Sin nombre',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              'SKU: ${product['sku'] ?? 'N/A'}',
                              style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), fontSize: 12),
                            ),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              GestureDetector(
                                onTap: () {
                                  final ctrl = TextEditingController(text: suggestedPrice.toStringAsFixed(0));
                                  bool isSaving = false;
                                  showFormSheet(
                                    context: context,
                                    title: 'Editar Precio Sugerido',
                                    builder: (c, setModalState) => Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        AppField.money(
                                          label: 'Precio',
                                          controller: ctrl,
                                          required: true,
                                        ),
                                        const SizedBox(height: 24),
                                        AppButton(
                                          label: 'Guardar',
                                          loading: isSaving,
                                          onPressed: () async {
                                            final val = double.tryParse(ctrl.text);
                                            if (val != null) {
                                              setModalState(() => isSaving = true);
                                              try {
                                                await apiClient.put('/products/${product['id']}', data: {'selling_price': val});
                                                ref.invalidate(inventoryProvider);
                                                if (!c.mounted) return;
                                                Navigator.pop(c);
                                              } catch (e) {
                                                if (!context.mounted) return;
                                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                              } finally {
                                                if (c.mounted) setModalState(() => isSaving = false);
                                              }
                                            }
                                          },
                                        ),
                                      ],
                                    ),
                                  );
                                },
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      '\$${suggestedPrice.toStringAsFixed(0)}',
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(PhosphorIconsRegular.pencilSimple, size: 13, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$stock unds',
                                style: TextStyle(
                                  color: isOut ? const Color(0xFFB91C1C) : (isLowStock ? const Color(0xFFB45309) : const Color(0xFF059669)),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ),
                       ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreationOptions,
        icon: const Icon(PhosphorIconsBold.plus, size: 18),
        label: const Text('Añadir', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}
