import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../providers/sales_provider.dart';
import '../providers/inventory_provider.dart';
import '../providers/dashboard_provider.dart';
import '../api/api_client.dart';

class ReturnsScreen extends ConsumerStatefulWidget {
  const ReturnsScreen({super.key});

  @override
  ConsumerState<ReturnsScreen> createState() => _ReturnsScreenState();
}

class _ReturnsScreenState extends ConsumerState<ReturnsScreen> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  final Map<String, Map<String, int>> _returnQuantities = {};
  bool _isProcessing = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _processReturn(String saleId, List<dynamic> details) async {
    final quantities = _returnQuantities[saleId] ?? {};
    final itemsToReturn = quantities.entries
        .where((e) => e.value > 0)
        .map((e) => {"sale_detail_id": e.key, "quantity": e.value})
        .toList();

    if (itemsToReturn.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona al menos 1 repuesto para devolver')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      await apiClient.post('/sales/$saleId/return', data: {
        "items": itemsToReturn,
        "notes": "Devolución desde App Móvil"
      });
      
      ref.invalidate(salesProvider);
      ref.invalidate(dashboardProvider);
      ref.invalidate(inventoryProvider);

      setState(() {
        _returnQuantities.remove(saleId);
        _isProcessing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Devolución procesada con éxito'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final salesAsync = ref.watch(salesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0);
    final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Devoluciones'),
      ),
      body: salesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
        data: (sales) {
          final filteredSales = sales.where((s) {
            final id = (s['invoice_number'] ?? s['id'].toString().substring(0, 8)).toString().toUpperCase();
            return id.contains(_searchQuery.toUpperCase());
          }).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por ID de venta...',
                    prefixIcon: const Icon(PhosphorIconsRegular.magnifyingGlass),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF111827) : Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ),
              Expanded(
                child: filteredSales.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(PhosphorIconsRegular.arrowUUpLeft, size: 56, color: muted),
                            const SizedBox(height: 12),
                            Text(
                              'No hay ventas que coincidan',
                              style: TextStyle(color: muted, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: filteredSales.length,
                        separatorBuilder: (c, i) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final sale = filteredSales[index];
                          final id = sale['id'];
                          final invoiceNumber = sale['invoice_number'] ?? id.toString().substring(0, 8).toUpperCase();
                          final dateStr = sale['sale_date'] != null
                              ? DateTime.parse(sale['sale_date']).toLocal().toString().split('.')[0]
                              : sale['created_at'] != null 
                                ? DateTime.parse(sale['created_at']).toLocal().toString().split('.')[0] 
                                : 'Fecha desconocida';
                          final total = sale['total'] ?? 0.0;
                          final items = sale['details'] as List<dynamic>? ?? [];
                          
                          final sq = _returnQuantities[id] ?? {};
                          final hasReturnsSelected = sq.values.any((v) => v > 0);

                          return Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF111827) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: border),
                            ),
                            child: Theme(
                              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                              child: ExpansionTile(
                                shape: const Border(),
                                collapsedShape: const Border(),
                                leading: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(PhosphorIconsRegular.arrowUUpLeft, color: Colors.orange, size: 20),
                                ),
                                title: Text('Venta #$invoiceNumber', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                subtitle: Text('\$${total.toStringAsFixed(2)} • $dateStr', style: TextStyle(color: muted, fontSize: 12)),
                                children: [
                                  ...items.map((item) {
                                    final detailId = item['id'];
                                    final pName = item['product_name'] ?? 'Producto';
                                    final qty = item['quantity'] ?? 0;
                                    final price = item['unit_price'] ?? 0.0;
                                    final returnQty = sq[detailId] ?? 0;

                                    return ListTile(
                                      title: Text(pName),
                                      subtitle: Text('Comprados: $qty | Precio: \$${price.toStringAsFixed(0)}'),
                                      trailing: qty > 0 ? Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          IconButton(
                                            icon: const Icon(PhosphorIconsRegular.minusCircle, size: 20),
                                            onPressed: returnQty > 0 ? () {
                                              setState(() {
                                                if (_returnQuantities[id] == null) _returnQuantities[id] = {};
                                                _returnQuantities[id]![detailId] = returnQty - 1;
                                              });
                                            } : null,
                                          ),
                                          Text('$returnQty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                          IconButton(
                                            icon: const Icon(PhosphorIconsRegular.plusCircle, size: 20),
                                            onPressed: returnQty < qty ? () {
                                              setState(() {
                                                if (_returnQuantities[id] == null) _returnQuantities[id] = {};
                                                _returnQuantities[id]![detailId] = returnQty + 1;
                                              });
                                            } : null,
                                          ),
                                        ],
                                      ) : Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                                        child: const Text('Devuelto', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                                      ),
                                    );
                                  }),
                                  if (hasReturnsSelected)
                                    Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton.icon(
                                          onPressed: _isProcessing ? null : () => _processReturn(id, items),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.orange,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 14),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                          icon: _isProcessing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(PhosphorIconsRegular.arrowUUpLeft),
                                          label: Text(_isProcessing ? 'Procesando...' : 'Procesar Devolución'),
                                        ),
                                      ),
                                    )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
