import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/inventory_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/customers_provider.dart';
import '../providers/categories_provider.dart';
import '../providers/brands_provider.dart';
import '../providers/sales_provider.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({super.key});

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  
  String? _selectedCategory;
  String? _selectedBrand;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCartBottomSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return const _CartBottomSheet();
      },
    );
  }

  void _handleAddToCart(BuildContext context, WidgetRef ref, Map<String, dynamic> p) {
    final batches = (p['batches'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    if (batches.isEmpty) {
      _addToCartDirectly(context, ref, p);
      return;
    }
    
    final availableBatches = batches.where((b) => (b['current_stock'] as num? ?? 0) > 0).toList();
    if (availableBatches.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No hay lotes con stock')));
      return;
    }

    if (availableBatches.length == 1) {
      _addToCartDirectly(context, ref, p, availableBatches.first);
      return;
    }

    showFormSheet(
      context: context,
      title: 'Seleccionar Lote',
      subtitle: p['name'],
      builder: (c, setModalState) {
        return Column(
          children: availableBatches.map((b) {
            final date = DateTime.tryParse(b['created_at'] ?? '')?.toLocal().toString().split(' ')[0] ?? '';
            return ListTile(
              title: Text('Venta Sugerida: \$${b['selling_price']}'),
              subtitle: Text('Ingreso: $date | Stock: ${b['current_stock']} | Costo: \$${b['cost_price']}'),
              trailing: const Icon(PhosphorIconsRegular.caretRight),
              onTap: () {
                Navigator.pop(c);
                _addToCartDirectly(context, ref, p, b);
              },
            );
          }).toList(),
        );
      },
    );
  }

  void _addToCartDirectly(BuildContext context, WidgetRef ref, Map<String, dynamic> product, [Map<String, dynamic>? batch]) {
    final availableStock = double.tryParse((batch != null ? batch['current_stock'] : product['current_stock'])?.toString() ?? '0') ?? 0.0;
    final cartItems = ref.read(cartProvider);
    final key = '${product['id']}-${batch?['id'] ?? ''}';
    
    // Manual firstOrNull implementation for dart < 3 or without collection package
    CartItem? existingItem;
    for (final item in cartItems) {
      if (item.cartKey == key) {
        existingItem = item;
        break;
      }
    }
    
    final currentQty = existingItem?.quantity ?? 0;
    
    if (currentQty + 1 > availableStock) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('No hay suficiente stock disponible'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 2),
      ));
      return;
    }

    final suggestedPrice = batch != null ? double.tryParse(batch['selling_price']?.toString() ?? '0') ?? 0.0 : double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0;
    ref.read(cartProvider.notifier).addProductWithPrice(product, suggestedPrice, batch: batch);
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('${product['name']} agregado al carrito'),
      duration: const Duration(seconds: 1),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final brandsAsync = ref.watch(brandsProvider);
    
    final cartItems = ref.watch(cartProvider);
    final cartItemCount = ref.watch(cartProvider.notifier).itemCount;
    final cartTotal = ref.watch(cartProvider.notifier).total;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Punto de Venta', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.surface,
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.clockCounterClockwise),
            tooltip: 'Historial de Ventas',
            onPressed: () => context.push('/sales-history'),
          )
        ],
      ),
      body: Column(
        children: [
          // Búsqueda
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Buscar repuesto...',
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
                _buildFilterChip('Categoría', _selectedCategory, categoriesAsync, (id) => setState(() => _selectedCategory = id)),
                const SizedBox(width: 8),
                _buildFilterChip('Marca', _selectedBrand, brandsAsync, (id) => setState(() => _selectedBrand = id)),
                if (_selectedCategory != null || _selectedBrand != null) ...[
                  const SizedBox(width: 8),
                  ActionChip(
                    label: const Text('Limpiar'),
                    onPressed: () => setState(() { _selectedCategory = null; _selectedBrand = null; }),
                  )
                ]
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Lista de Productos
          Expanded(
            child: inventoryAsync.when(
              skipLoadingOnReload: true,
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(child: Text('Error: $e')),
              data: (products) {
                final filtered = products.where((p) {
                  final name = (p['name'] ?? '').toString().toLowerCase();
                  final sku = (p['sku'] ?? '').toString().toLowerCase();
                  final matchesSearch = name.contains(_searchQuery) || sku.contains(_searchQuery);
                  
                  bool matchesCat = _selectedCategory == null || p['category_id'] == _selectedCategory;
                  bool matchesBrand = _selectedBrand == null || p['brand_id'] == _selectedBrand;
                  
                  return matchesSearch && matchesCat && matchesBrand;
                }).toList();

                if (filtered.isEmpty) return const Center(child: Text('No se encontraron productos'));

                return ListView.separated(
                  padding: const EdgeInsets.all(16).copyWith(bottom: 100),
                  itemCount: filtered.length,
                  separatorBuilder: (c, i) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    final stock = p['current_stock'] ?? 0;
                    final suggestedPrice = double.tryParse(p['selling_price']?.toString() ?? '0') ?? 0.0;
                    
                    // Buscar si está en el carrito
                    final cartQty = cartItems.where((item) => item.product['id'] == p['id']).fold(0, (sum, item) => sum + item.quantity);

                    
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
                      ),
                      color: isDark ? const Color(0xFF111827) : Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                width: 50, height: 50,
                                color: isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9),
                                child: p['image_url'] != null 
                                    ? Image.network(p['image_url'], fit: BoxFit.cover)
                                    : Icon(PhosphorIconsRegular.wrench, color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p['name'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                                  const SizedBox(height: 4),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: [
                                      Text('Sug: \$${suggestedPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                      Text('Stock: $stock', style: TextStyle(color: stock == 0 ? const Color(0xFFB91C1C) : const Color(0xFF059669), fontSize: 12, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            
                            // Controles de cantidad
                            if (stock == 0)
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8.0),
                                child: Text('AGOTADO', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                              )
                            else
                              OutlinedButton(
                                onPressed: () => _handleAddToCart(context, ref, p),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 38),
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: Text(cartQty > 0 ? 'En carrito ($cartQty)' : 'Agregar'),
                              )
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      bottomSheet: cartItemCount > 0
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111827) : Colors.white,
                border: Border(top: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0))),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$cartItemCount repuestos en carrito', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                        Text('\$${cartTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _showCartBottomSheet(context, ref),
                        child: const Text('Ver compra final'),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
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
              error: (err, st) => Center(child: Text('Error')),
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
}

class _CartBottomSheet extends ConsumerStatefulWidget {
  const _CartBottomSheet();

  @override
  ConsumerState<_CartBottomSheet> createState() => _CartBottomSheetState();
}

class _CartBottomSheetState extends ConsumerState<_CartBottomSheet> with SingleTickerProviderStateMixin {
  bool _isProcessing = false;
  bool _success = false;
  String? _selectedCustomerId;
  String? _selectedCustomerName;
  DateTime _saleDate = DateTime.now();

  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _scaleAnimation = CurvedAnimation(parent: _animController, curve: Curves.elasticOut);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _processSale() async {
    final cartItems = ref.read(cartProvider);
    final total = ref.read(cartProvider.notifier).total;
    
    setState(() => _isProcessing = true);

    try {
      final details = cartItems.map((item) {
        return {
          "product_id": item.product['id'],
          "batch_id": item.batch?['id'],
          "quantity": item.quantity,
          "unit_price": item.unitPrice,
          "discount": 0
        };
      }).toList();

      final payload = {
        "customer_id": _selectedCustomerId,
        "subtotal": total,
        "discount": 0,
        "tax": 0,
        "total": total,
        "payment_method": "EFECTIVO",
        "payment_status": "PAGADO",
        "notes": "Venta desde App Móvil",
        "sale_date": _saleDate.toUtc().toIso8601String(),
        "details": details
      };

      await apiClient.post('/sales/', data: payload);
      
      ref.read(cartProvider.notifier).clear();
      ref.invalidate(dashboardProvider);
      ref.invalidate(inventoryProvider);
      ref.invalidate(salesProvider);

      setState(() {
        _isProcessing = false;
        _success = true;
      });
      _animController.forward();
      
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) Navigator.pop(context);

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
      setState(() => _isProcessing = false);
    }
  }

  void _showPriceEditor(BuildContext context, String cartKey, double currentPrice) {
    final ctrl = TextEditingController(text: currentPrice.toStringAsFixed(2));
    showFormSheet(
      context: context,
      title: 'Editar precio unitario',
      builder: (c, setModalState) {
        return Column(
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
              onPressed: () {
                final newPrice = double.tryParse(ctrl.text);
                if (newPrice != null) {
                  ref.read(cartProvider.notifier).updateCustomPrice(cartKey, newPrice);
                }
                Navigator.pop(c);
              },
              icon: PhosphorIconsRegular.floppyDisk,
            )
          ],
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Container(
        height: 300,
        alignment: Alignment.center,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(PhosphorIconsFill.checkCircle, color: Colors.green, size: 100),
              SizedBox(height: 16),
              Text('¡Venta Exitosa!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green)),
            ],
          ),
        ),
      );
    }

    final cartItems = ref.watch(cartProvider);
    final cartNotifier = ref.read(cartProvider.notifier);
    final total = cartNotifier.total;
    final customersAsync = ref.watch(customersProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 5,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Resumen de Venta', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(PhosphorIconsRegular.calendar, size: 16),
                      label: Text("${_saleDate.day}/${_saleDate.month}/${_saleDate.year}"),
                      onPressed: () async {
                        final d = await showDatePicker(
                          context: context,
                          initialDate: _saleDate,
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100)
                        );
                        if (d != null) setState(() => _saleDate = d);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(PhosphorIconsRegular.user, size: 16),
                      label: Text(_selectedCustomerName ?? 'Cliente (Opcional)', overflow: TextOverflow.ellipsis),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          builder: (c) => customersAsync.when(
                            loading: () => const Center(child: CircularProgressIndicator()),
                            error: (e, s) => const Center(child: Text('Error')),
                            data: (customers) => ListView.builder(
                              itemCount: customers.length,
                              itemBuilder: (ctx, i) => ListTile(
                                title: Text(customers[i]['name']),
                                onTap: () {
                                  setState(() {
                                    _selectedCustomerId = customers[i]['id'];
                                    _selectedCustomerName = customers[i]['name'];
                                  });
                                  Navigator.pop(ctx);
                                },
                              ),
                            ),
                          )
                        );
                      },
                    ),
                  ),
                ],
              ),
              const Divider(height: 32),

              if (cartItems.isEmpty)
                const Expanded(child: Center(child: Text('El carrito está vacío', style: TextStyle(color: Colors.grey))))
              else
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: cartItems.length,
                    itemBuilder: (context, index) {
                      final item = cartItems[index];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('${item.product['name']} ${item.batch != null ? '(Lote: ${DateTime.tryParse(item.batch!['created_at'] ?? '')?.toLocal().toString().split(' ')[0] ?? ''})' : ''}'),
                        subtitle: GestureDetector(
                          onTap: () => _showPriceEditor(context, item.cartKey, item.unitPrice),
                          child: Text(
                            '\$${item.unitPrice.toStringAsFixed(0)} c/u (Toca para editar)', 
                            style: const TextStyle(color: Colors.blue, decoration: TextDecoration.underline)
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(PhosphorIconsRegular.minusCircle),
                              onPressed: () => cartNotifier.updateQuantity(item.cartKey, item.quantity - 1),
                            ),
                            Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            IconButton(
                              icon: const Icon(PhosphorIconsRegular.plusCircle),
                              onPressed: () {
                                final availableStock = double.tryParse((item.batch != null ? item.batch!['current_stock'] : item.product['current_stock'])?.toString() ?? '0') ?? 0.0;
                                if (item.quantity + 1 > availableStock) {
                                  ScaffoldMessenger.of(context).clearSnackBars();
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                                    content: Text('No hay suficiente stock disponible'),
                                    backgroundColor: Colors.red,
                                    duration: Duration(seconds: 2),
                                  ));
                                } else {
                                  cartNotifier.updateQuantity(item.cartKey, item.quantity + 1);
                                }
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total a cobrar:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('\$${total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.blue)),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: cartItems.isEmpty || _isProcessing ? null : _processSale,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isProcessing
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Cobrar', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
