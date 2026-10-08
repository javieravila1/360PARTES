import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../providers/sales_provider.dart';

class SalesHistoryScreen extends ConsumerStatefulWidget {
  const SalesHistoryScreen({super.key});

  @override
  ConsumerState<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends ConsumerState<SalesHistoryScreen> {
  String _dateFilter = 'today';
  DateTime? _customStart;
  DateTime? _customEnd;

  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return 'Fecha desconocida';
    try {
      final d = DateTime.parse(dateVal.toString()).toLocal();
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return 'Fecha desconocida';
    }
  }

  List<dynamic> _filterSales(List<dynamic> allSales) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    DateTime? start;
    DateTime? end;

    if (_dateFilter == 'custom') {
      start = _customStart;
      end = _customEnd != null ? DateTime(_customEnd!.year, _customEnd!.month, _customEnd!.day, 23, 59, 59) : null;
    } else if (_dateFilter != 'all') {
      end = DateTime(today.year, today.month, today.day, 23, 59, 59);
      switch (_dateFilter) {
        case 'today':
          start = today;
          break;
        case 'yesterday':
          start = today.subtract(const Duration(days: 1));
          end = DateTime(start.year, start.month, start.day, 23, 59, 59);
          break;
        case 'this_week':
          start = today.subtract(Duration(days: today.weekday - 1));
          break;
        case 'last_15_days':
          start = today.subtract(const Duration(days: 15));
          break;
        case 'this_month':
          start = DateTime(today.year, today.month, 1);
          break;
        case 'this_quarter':
          final qMonth = ((today.month - 1) ~/ 3) * 3 + 1;
          start = DateTime(today.year, qMonth, 1);
          break;
        case 'this_semester':
          final sMonth = today.month <= 6 ? 1 : 7;
          start = DateTime(today.year, sMonth, 1);
          break;
        case 'this_year':
          start = DateTime(today.year, 1, 1);
          break;
      }
    }

    var filtered = allSales.where((sale) {
      final dVal = sale['sale_date'] ?? sale['created_at'];
      if (dVal == null) return false;
      try {
        final d = DateTime.parse(dVal.toString()).toLocal();
        if (start != null && d.isBefore(start)) return false;
        if (end != null && d.isAfter(end)) return false;
        return true;
      } catch (_) {
        return false;
      }
    }).toList();

    filtered.sort((a, b) {
      final da = DateTime.tryParse((a['sale_date'] ?? a['created_at'] ?? '').toString())?.toLocal() ?? DateTime(2000);
      final db = DateTime.tryParse((b['sale_date'] ?? b['created_at'] ?? '').toString())?.toLocal() ?? DateTime(2000);
      return db.compareTo(da);
    });

    return filtered;
  }

  Future<void> _selectCustomDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).brightness == Brightness.dark
                ? const ColorScheme.dark(primary: Color(0xFF4F46E5), surface: Color(0xFF1E293B))
                : const ColorScheme.light(primary: Color(0xFF4F46E5)),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dateFilter = 'custom';
        _customStart = picked.start;
        _customEnd = picked.end;
      });
    } else {
      // Revert if cancelled
      if (_dateFilter == 'custom' && _customStart == null) {
        setState(() => _dateFilter = 'today');
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
        title: const Text('Historial de ventas'),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.downloadSimple),
            tooltip: 'Exportar a Excel',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Generando archivo Excel...')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111827) : Colors.white,
              border: Border(bottom: BorderSide(color: border)),
            ),
            child: Row(
              children: [
                const Icon(PhosphorIconsRegular.calendarBlank, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _dateFilter,
                      isExpanded: true,
                      icon: const Icon(PhosphorIconsRegular.caretDown),
                      items: const [
                        DropdownMenuItem(value: 'today', child: Text('Hoy')),
                        DropdownMenuItem(value: 'yesterday', child: Text('Ayer')),
                        DropdownMenuItem(value: 'this_week', child: Text('Esta semana')),
                        DropdownMenuItem(value: 'last_15_days', child: Text('Últimos 15 días')),
                        DropdownMenuItem(value: 'this_month', child: Text('Este mes')),
                        DropdownMenuItem(value: 'this_quarter', child: Text('Este trimestre')),
                        DropdownMenuItem(value: 'this_semester', child: Text('Este semestre')),
                        DropdownMenuItem(value: 'this_year', child: Text('Este año')),
                        DropdownMenuItem(value: 'all', child: Text('Todas las ventas')),
                        DropdownMenuItem(value: 'custom', child: Text('Rango personalizado...')),
                      ],
                      onChanged: (val) {
                        if (val == 'custom') {
                          _selectCustomDateRange();
                        } else if (val != null) {
                          setState(() {
                            _dateFilter = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_dateFilter == 'custom' && _customStart != null && _customEnd != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              width: double.infinity,
              color: const Color(0xFF4F46E5).withValues(alpha: 0.1),
              child: Text(
                'Filtrando desde ${_customStart!.day.toString().padLeft(2,'0')}/${_customStart!.month.toString().padLeft(2,'0')}/${_customStart!.year} hasta ${_customEnd!.day.toString().padLeft(2,'0')}/${_customEnd!.month.toString().padLeft(2,'0')}/${_customEnd!.year}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ),
          
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(salesProvider);
              },
              child: salesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => Center(child: Text('Error: $e')),
                data: (allSales) {
                  final sales = _filterSales(allSales);

                  if (sales.isEmpty) {
                    return ListView(
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                        Icon(PhosphorIconsRegular.receipt, size: 56, color: muted),
                        const SizedBox(height: 12),
                        Center(
                          child: Text(
                            'No se encontraron ventas',
                            style: TextStyle(color: muted, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: sales.length,
                    separatorBuilder: (c, i) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final sale = sales[index];
                      final dateStr = _formatDate(sale['sale_date'] ?? sale['created_at']);
                      final total = sale['total'] ?? 0.0;
                      final items = sale['details'] as List<dynamic>? ?? [];

                      return Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
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
                                color: const Color(0xFF059669).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                PhosphorIconsRegular.receipt,
                                color: Color(0xFF059669),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              '\$${total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            subtitle: Text(
                              dateStr,
                              style: TextStyle(color: muted, fontSize: 12),
                            ),
                            children: items.map((item) {
                              final pName = item['product_name'] ?? 'Producto';
                              final qty = item['quantity'] ?? 1;
                              final price = item['unit_price'] ?? 0.0;
                              return ListTile(
                                dense: true,
                                title: Text('$qty x $pName'),
                                trailing: Text(
                                  '\$${(qty * price).toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

