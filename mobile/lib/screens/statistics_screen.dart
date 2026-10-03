import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import '../providers/dashboard_provider.dart';

class StatisticsScreen extends ConsumerWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashAsync = ref.watch(dashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Estadísticas', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: _buildTimeFilterDropdown(ref, dashboardTimeFilterProvider),
          ),
        ],
      ),
      body: dashAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
        data: (metrics) {
          final totalSales = metrics['total_sales'] ?? 0.0;
          final expenses = metrics['total_expenses'] ?? 0.0;
          final totalProfit = metrics['total_profit'] ?? 0.0;
          final productsSold = metrics['products_sold'] ?? 0;
          final lowStockCount = (metrics['low_stock'] as List?)?.length ?? 0;
          final salesChart = metrics['sales_chart'] as List<dynamic>? ?? [];

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderStats(totalSales, totalProfit, expenses, isDark),
                const SizedBox(height: 24),
                _buildChartSection(salesChart, isDark, ref),
                const SizedBox(height: 24),
                _buildSectionTitle('Métricas Adicionales', PhosphorIconsRegular.chartBar),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildMiniCard('Productos Vendidos', '$productsSold', PhosphorIconsRegular.package, Colors.indigo, isDark)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMiniCard('Stock Crítico', '$lowStockCount', PhosphorIconsRegular.warning, Colors.redAccent, isDark)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildMiniCard('Balance Total', '\$${(totalSales - expenses).toStringAsFixed(0)}', PhosphorIconsRegular.scales, (totalSales - expenses) >= 0 ? Colors.green : Colors.orange, isDark)),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderStats(double sales, double profit, double expenses, bool isDark) {
    return Column(
      children: [
        _buildMainCard('Ventas Totales', sales, const [Color(0xFF6366F1), Color(0xFF8B5CF6)], PhosphorIconsRegular.trendUp),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMainCard('Ganancia', profit, const [Color(0xFF10B981), Color(0xFF34D399)], PhosphorIconsRegular.currencyDollar, isSmall: true)),
            const SizedBox(width: 12),
            Expanded(child: _buildMainCard('Gastos', expenses, const [Color(0xFFF43F5E), Color(0xFFFB7185)], PhosphorIconsRegular.receipt, isSmall: true)),
          ],
        )
      ],
    );
  }

  Widget _buildMainCard(String title, double value, List<Color> gradient, IconData icon, {bool isSmall = false}) {
    return Container(
      padding: EdgeInsets.all(isSmall ? 16 : 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: gradient.first.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: isSmall ? 13 : 14, fontWeight: FontWeight.w600)),
                SizedBox(height: isSmall ? 4 : 8),
                Text('\$${value.toStringAsFixed(0)}', style: TextStyle(color: Colors.white, fontSize: isSmall ? 22 : 32, fontWeight: FontWeight.bold, letterSpacing: -1)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: isSmall ? 20 : 28),
          )
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildChartSection(List<dynamic> chartData, bool isDark, WidgetRef ref) {
    if (chartData.isEmpty) {
      return Container(
        height: 200,
        decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: BorderRadius.circular(20)),
        child: const Center(child: Text('No hay datos suficientes', style: TextStyle(color: Colors.grey))),
      );
    }

    // Convert string to DateTime and double for spots
    final spots = <FlSpot>[];
    double maxY = 0;
    
    // Sort data properly just in case
    chartData.sort((a, b) => a['date'].compareTo(b['date']));

    for (int i = 0; i < chartData.length; i++) {
      final total = double.tryParse(chartData[i]['total'].toString()) ?? 0.0;
      if (total > maxY) maxY = total;
      spots.add(FlSpot(i.toDouble(), total));
    }

    if (maxY == 0) maxY = 100; // default to avoid zero div

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Evolución de Ventas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              _buildTimeFilterDropdown(ref, dashboardChartTimeFilterProvider),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY / 4,
                  getDrawingHorizontalLine: (value) => FlLine(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200, strokeWidth: 1, dashArray: [5, 5]),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      interval: (chartData.length / 5).ceilToDouble().clamp(1.0, 100.0),
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= chartData.length) return const SizedBox();
                        final dateStr = chartData[index]['date'];
                        final parts = dateStr.split('-');
                        if (parts.length == 3) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text('${parts[2]}/${parts[1]}', style: TextStyle(color: Colors.grey.shade500, fontSize: 10, fontWeight: FontWeight.bold)),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: maxY / 4,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        if (value == 0) return const SizedBox();
                        return Text('\$${(value/1000).toStringAsFixed(0)}k', style: TextStyle(color: Colors.grey.shade500, fontSize: 10, fontWeight: FontWeight.bold));
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: (chartData.length - 1).toDouble(),
                minY: 0,
                maxY: maxY * 1.2,
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: spots.length == 1),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [const Color(0xFF6366F1).withValues(alpha: 0.3), const Color(0xFF6366F1).withValues(alpha: 0.0)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        return LineTooltipItem(
                          '\$${spot.y.toStringAsFixed(0)}\n',
                          const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          children: [
                            TextSpan(
                              text: chartData[spot.x.toInt()]['date'],
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 10, fontWeight: FontWeight.normal),
                            )
                          ],
                        );
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniCard(String title, String value, IconData icon, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(title, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildTimeFilterDropdown(WidgetRef ref, StateProvider<String> provider) {
    final currentFilter = ref.watch(provider);
    
    String getLabel(String val) {
      switch (val) {
        case 'today': return 'Hoy';
        case 'this_week': return 'Semana';
        case 'this_month': return 'Mes';
        case 'this_semester': return 'Semestre';
        case 'this_year': return 'Año';
        case 'all_time': return 'Todo';
        default: return 'Mes';
      }
    }

    return PopupMenuButton<String>(
      onSelected: (val) => ref.read(provider.notifier).state = val,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.indigo.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(getLabel(currentFilter), style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(width: 4),
            const Icon(PhosphorIconsRegular.caretDown, color: Colors.indigo, size: 12),
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
