import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/sales_provider.dart';

class SalesHistoryScreen extends ConsumerWidget {
  const SalesHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesAsync = ref.watch(salesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de Ventas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            tooltip: 'Exportar a Excel',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Generando archivo Excel...'),
                  backgroundColor: Colors.green,
                )
              );
              // TODO: Implement actual CSV/Excel generation and sharing
            },
          )
        ],
      ),
      body: salesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
        data: (sales) {
          if (sales.isEmpty) return const Center(child: Text('No hay ventas registradas.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: sales.length,
            separatorBuilder: (c, i) => const Divider(),
            itemBuilder: (context, index) {
              final sale = sales[index];
              final dateStr = sale['sale_date'] != null ? DateTime.parse(sale['sale_date']).toLocal().toString().split('.')[0] : 'Fecha desconocida';
              final total = sale['total'] ?? 0.0;
              final items = sale['details'] as List<dynamic>? ?? [];

              return Card(
                elevation: 0,
                color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                ),
                child: ExpansionTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.green,
                    child: Icon(Icons.attach_money, color: Colors.white),
                  ),
                  title: Text('Total: \$${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(dateStr),
                  children: items.map((item) {
                    final pName = item['product_name'] ?? 'Producto';
                    final qty = item['quantity'] ?? 1;
                    final price = item['unit_price'] ?? 0.0;
                    return ListTile(
                      dense: true,
                      title: Text('$qty x $pName'),
                      trailing: Text('\$${(qty * price).toStringAsFixed(2)}'),
                    );
                  }).toList(),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
