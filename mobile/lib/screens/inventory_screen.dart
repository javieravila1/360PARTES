import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/inventory_provider.dart';
import '../providers/categories_provider.dart';
import '../providers/brands_provider.dart';
import '../api/api_client.dart';
import 'product_form_screen.dart';
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
                leading: const CircleAvatar(backgroundColor: Colors.blue, child: Icon(PhosphorIconsRegular.package, color: Colors.white)),
                title: const Text('Nuevo Producto'),
                subtitle: const Text('Agregar un repuesto al inventario'),
                onTap: () {
                  Navigator.pop(ctx);
                  context.push('/product-form');
                },
              ),
              const Divider(),
              ListTile(
                leading: const CircleAvatar(backgroundColor: Colors.orange, child: Icon(PhosphorIconsRegular.tag, color: Colors.white)),
                title: const Text('Nueva Categoría'),
                subtitle: const Text('Ej: Frenos, Motor, Eléctrico...'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showQuickCreateDialog('Categoría', '/categories/', categoriesProvider);
                },
              ),
              const Divider(),
              ListTile(
                leading: const CircleAvatar(backgroundColor: Colors.teal, child: Icon(PhosphorIconsRegular.bookmarks, color: Colors.white)),
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

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (c, setModalState) {
          return AlertDialog(
            title: Text('Crear $entityName'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nombre')),
                const SizedBox(height: 12),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Descripción (Opcional)')),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancelar')),
              ElevatedButton(
                onPressed: isSaving ? null : () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  setModalState(() => isSaving = true);
                  try {
                    await apiClient.post(endpoint, data: {
                      "name": nameCtrl.text.trim(),
                      "description": descCtrl.text.trim()
                    });
                    ref.invalidate(providerToRefresh);
                    if (mounted) {
                      Navigator.pop(c);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$entityName creada')));
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  } finally {
                    setModalState(() => isSaving = false);
                  }
                },
                child: isSaving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text('Guardar'),
              )
            ],
          );
        }
      )
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
                hintText: 'Buscar repuesto por nombre o SKU...',
                prefixIcon: const Icon(PhosphorIconsRegular.magnifyingGlass),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
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
                    padding: const EdgeInsets.only(bottom: 80),
                    itemCount: filteredProducts.length,
                    separatorBuilder: (context, index) => Divider(
                      height: 1,
                      color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                      indent: 16,
                      endIndent: 16,
                    ),
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      final stock = product['current_stock'] ?? 0;
                      final isLowStock = stock <= 5;
                      final isOut = stock == 0;
                      final suggestedPrice = double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0;

                      return Dismissible(
                        key: Key(product['id'].toString()),
                        background: Container(
                          color: Colors.green,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(PhosphorIconsRegular.plusCircle, color: Colors.white),
                        ),
                        secondaryBackground: Container(
                          color: Colors.red,
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
                        child: ListTile(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => ProductFormScreen(product: product)));
                          },
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF334155) : Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: product['image_url'] != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(product['image_url'], fit: BoxFit.cover),
                                  )
                                : Icon(PhosphorIconsRegular.wrench, color: isDark ? Colors.blue.shade300 : Colors.blue),
                          ),
                          title: Text(
                            product['name'] ?? 'Sin nombre',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              'SKU: ${product['sku'] ?? 'N/A'}',
                              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                            ),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              GestureDetector(
                                onTap: () {
                                  final ctrl = TextEditingController(text: suggestedPrice.toStringAsFixed(0));
                                  showDialog(
                                    context: context,
                                    builder: (c) => AlertDialog(
                                      title: const Text('Editar Precio Sugerido'),
                                      content: TextField(
                                        controller: ctrl,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(prefixText: '\$'),
                                        autofocus: true,
                                      ),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancelar')),
                                        ElevatedButton(
                                          onPressed: () async {
                                            final val = double.tryParse(ctrl.text);
                                            if (val != null) {
                                              try {
                                                await apiClient.put('/products/${product['id']}', data: {'selling_price': val});
                                                ref.invalidate(inventoryProvider);
                                                if (context.mounted) Navigator.pop(c);
                                              } catch (e) {
                                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                              }
                                            }
                                          },
                                          child: const Text('Guardar'),
                                        )
                                      ],
                                    )
                                  );
                                },
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Sug: \$${suggestedPrice.toStringAsFixed(0)}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blue),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(PhosphorIconsRegular.pencilSimple, size: 14, color: Colors.blue),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$stock unds',
                                style: TextStyle(
                                  color: isOut ? Colors.red : (isLowStock ? Colors.orange : Colors.green),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
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
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(PhosphorIconsRegular.plus, color: Colors.white),
        label: const Text('Añadir', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
