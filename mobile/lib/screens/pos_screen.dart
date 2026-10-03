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

  void _askForFinalPrice(BuildContext context, WidgetRef ref, Map<String, dynamic> product) {
    final suggestedPrice = double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0;
    final ctrl = TextEditingController();
    
    showDialog(
      context: context,
      builder: (c) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Precio Final', style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(product['name'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    const Text('Sugerido', style: TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('\$${suggestedPrice.toStringAsFixed(0)}', style: const TextStyle(color: Colors.blue, fontSize: 18, fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: ctrl,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  hintText: '0',
                  prefixText: '\$ ',
                  prefixStyle: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(vertical: 20),
                ),
                autofocus: true,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(c),
                      child: const Text('Cancelar', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final finalPrice = double.tryParse(ctrl.text) ?? suggestedPrice;
                        ref.read(cartProvider.notifier).addProductWithPrice(product, finalPrice);
                        Navigator.pop(c);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Agregar', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      )
    );
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
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
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
                    final cartIndex = cartItems.indexWhere((item) => item.product['id'] == p['id']);
                    final cartQty = cartIndex >= 0 ? cartItems[cartIndex].quantity : 0;
                    
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                      ),
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                width: 50, height: 50,
                                color: Colors.blue.withOpacity(0.1),
                                child: p['image_url'] != null 
                                    ? Image.network(p['image_url'], fit: BoxFit.cover)
                                    : const Icon(PhosphorIconsRegular.wrench, color: Colors.blue),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p['name'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text('Sug: \$${suggestedPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                      const SizedBox(width: 8),
                                      Text('Stock: $stock', style: TextStyle(color: stock == 0 ? Colors.red : Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
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
                            else if (cartQty == 0)
                              OutlinedButton(
                                onPressed: () => _askForFinalPrice(context, ref, p),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  side: BorderSide(color: Colors.blue.shade300),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Agregar'),
                              )
                            else
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(PhosphorIconsRegular.minus, size: 18),
                                      color: Colors.blue,
                                      onPressed: () => ref.read(cartProvider.notifier).updateQuantity(p['id'], cartQty - 1),
                                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                      padding: EdgeInsets.zero,
                                    ),
                                    Text('$cartQty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
                                    IconButton(
                                      icon: const Icon(PhosphorIconsRegular.plus, size: 18),
                                      color: Colors.blue,
                                      onPressed: cartQty < stock ? () => ref.read(cartProvider.notifier).updateQuantity(p['id'], cartQty + 1) : null,
                                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                      padding: EdgeInsets.zero,
                                    ),
                                  ],
                                ),
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
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, -5))],
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Ver Compra Final', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
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

  void _showPriceEditor(BuildContext context, String productId, double currentPrice) {
    final ctrl = TextEditingController(text: currentPrice.toStringAsFixed(2));
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Editar precio unitario final'),
        content: TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(prefixText: '\$'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () {
              final newPrice = double.tryParse(ctrl.text);
              if (newPrice != null) {
                ref.read(cartProvider.notifier).updateCustomPrice(productId, newPrice);
              }
              Navigator.pop(c);
            },
            child: const Text('Guardar'),
          )
        ],
      )
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
                        title: Text(item.product['name'], maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: GestureDetector(
                          onTap: () => _showPriceEditor(context, item.product['id'], item.unitPrice),
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
                              onPressed: () => cartNotifier.updateQuantity(item.product['id'], item.quantity - 1),
                            ),
                            Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            IconButton(
                              icon: const Icon(PhosphorIconsRegular.plusCircle),
                              onPressed: () => cartNotifier.updateQuantity(item.product['id'], item.quantity + 1),
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
