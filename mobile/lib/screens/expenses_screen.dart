import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../providers/expenses_provider.dart';
import '../providers/suppliers_provider.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Compras y gastos'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Gastos Generales'),
            Tab(text: 'A Proveedores'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _GeneralExpensesView(),
          _SupplierExpensesView(),
        ],
      ),
    );
  }
}

class _GeneralExpensesView extends ConsumerStatefulWidget {
  const _GeneralExpensesView();
  @override
  ConsumerState<_GeneralExpensesView> createState() => _GeneralExpensesViewState();
}

class _GeneralExpensesViewState extends ConsumerState<_GeneralExpensesView> {
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  String _category = 'OTROS';
  DateTime _date = DateTime.now();
  bool _isSaving = false;

  Future<void> _saveExpense() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Revisa los datos')));
      return;
    }

    setState(() => _isSaving = true);
    try {
      await apiClient.post('/cash/expenses', data: {
        "category": _category,
        "description": _descController.text.trim(),
        "amount": amount,
        "expense_date": _date.toUtc().toIso8601String().split('T')[0],
        "payment_method": "TRANSFER"
      });
      ref.invalidate(expensesProvider);
      _amountController.clear();
      _descController.clear();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gasto registrado')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final expensesAsync = ref.watch(expensesProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(expensesProvider);
      },
      child: CustomScrollView(
        slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: FormSection(
                title: 'Registrar gasto',
                icon: PhosphorIconsRegular.wallet,
                children: [
                  AppSelectField(
                    label: 'Fecha',
                    value: "${_date.day}/${_date.month}/${_date.year}",
                    placeholder: 'Seleccionar fecha',
                    icon: PhosphorIconsRegular.calendar,
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _date,
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (d != null) setState(() => _date = d);
                    },
                  ),
                  AppField.money(
                    label: 'Monto',
                    controller: _amountController,
                    required: true,
                  ),
                  AppField(
                    label: 'Descripción',
                    controller: _descController,
                    required: true,
                    icon: PhosphorIconsRegular.textAa,
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: _category,
                    decoration: InputDecoration(
                      labelText: 'Categoría',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'SERVICIOS', child: Text('Servicios')),
                      DropdownMenuItem(value: 'NOMINA', child: Text('Nómina')),
                      DropdownMenuItem(value: 'ARRIENDO', child: Text('Arriendo')),
                      DropdownMenuItem(value: 'OTROS', child: Text('Otros')),
                    ],
                    onChanged: (val) => setState(() => _category = val!),
                  ),
                  AppButton(
                    label: 'Guardar gasto',
                    loading: _isSaving,
                    onPressed: _saveExpense,
                    icon: PhosphorIconsRegular.floppyDisk,
                  ),
                ],
              ),
            ),
          ),
        ),
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Text('Historial de gastos', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          ),
        ),
        expensesAsync.when(
          loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator())),
          error: (e, s) => SliverFillRemaining(child: Center(child: Text('Error: $e'))),
          data: (expenses) {
            if (expenses.isEmpty) return const SliverFillRemaining(child: Center(child: Text('No hay gastos registrados')));
            return SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final exp = expenses[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                    child: ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: const Color(0xFFB91C1C).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.south_east_rounded, color: Color(0xFFB91C1C), size: 18),
                      ),
                      title: Text(exp['description'], style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('${exp['category']} • ${exp['expense_date']}'),
                      trailing: Text('\$${exp['amount']}', style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.w700, fontSize: 15)),
                    ),
                  );
                },
                childCount: expenses.length,
              ),
            );
          },
        ),
      ],
    ),
    );
  }
}

class _SupplierExpensesView extends ConsumerStatefulWidget {
  const _SupplierExpensesView();
  @override
  ConsumerState<_SupplierExpensesView> createState() => _SupplierExpensesViewState();
}

class _SupplierExpensesViewState extends ConsumerState<_SupplierExpensesView> {
  final _amountController = TextEditingController();
  final _conceptController = TextEditingController(text: 'Compra de mercancía');
  String? _supplierId;
  String? _supplierName;
  DateTime _creditDate = DateTime.now();
  DateTime? _dueDate;

  bool _isSaving = false;

  Future<void> _saveDebt() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _supplierId == null || _conceptController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Revisa los datos')));
      return;
    }

    setState(() => _isSaving = true);
    try {
      await apiClient.post('/debts/', data: {
        "debt_type": "PAYABLE",
        "concept": _conceptController.text.trim(),
        "contact_name": _supplierName ?? "Proveedor",
        "total_amount": amount,
        "credit_date": _creditDate.toUtc().toIso8601String().split('T')[0],
        "due_date": _dueDate?.toUtc().toIso8601String().split('T')[0],
        "notes": ""
      });
      ref.invalidate(payablesProvider);
      _amountController.clear();
      _conceptController.text = 'Compra de mercancía';
      setState(() => _dueDate = null);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Crédito con proveedor registrado')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _addPayment(Map<String, dynamic> debt) {
    final ctrl = TextEditingController();
    bool isSavingPayment = false;

    showFormSheet(
      context: context,
      title: 'Abonar a Crédito',
      subtitle: 'Resta por pagar: \$${debt['balance']}',
      builder: (c, setModalState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppField.money(
              label: 'Cantidad a abonar',
              controller: ctrl,
              required: true,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Abonar',
              loading: isSavingPayment,
              onPressed: () async {
                final val = double.tryParse(ctrl.text);
                if (val != null && val > 0) {
                  setModalState(() => isSavingPayment = true);
                  try {
                    await apiClient.post('/debts/${debt['id']}/payments', data: {
                      "amount": val,
                      "payment_date": DateTime.now().toUtc().toIso8601String().split('T')[0]
                    });
                    ref.invalidate(payablesProvider);
                    if (!c.mounted) return;
                    Navigator.pop(c);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Abono registrado')));
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  } finally {
                    setModalState(() => isSavingPayment = false);
                  }
                }
              },
            ),
          ],
        );
      },
    );
  }

  void _showPaymentDetails(Map<String, dynamic> debt) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (c) {
        final payments = debt['payments'] as List<dynamic>? ?? [];
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Historial de Abonos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Divider(),
              if (payments.isEmpty)
                const Expanded(child: Center(child: Text('No hay abonos registrados')))
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: payments.length,
                    itemBuilder: (ctx, i) {
                      final p = payments[i];
                      return ListTile(
                        leading: const Icon(Icons.payment, color: Color(0xFF059669)),
                        title: Text('\$${p['amount']}'),
                        subtitle: Text('Fecha: ${p['payment_date']}'),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final suppliersAsync = ref.watch(suppliersProvider);
    final payablesAsync = ref.watch(payablesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(payablesProvider);
      },
      child: CustomScrollView(
        slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: FormSection(
                title: 'Registrar crédito',
                icon: PhosphorIconsRegular.handshake,
                children: [
                  AppSelectField(
                    label: 'Proveedor',
                    value: _supplierName,
                    placeholder: 'Seleccionar Proveedor',
                    icon: PhosphorIconsRegular.buildings,
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                        builder: (ctx) => suppliersAsync.when(
                          loading: () => const Center(child: CircularProgressIndicator()),
                          error: (e, s) => const Center(child: Text('Error')),
                          data: (sups) => Column(
                            children: [
                              const Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Text('Seleccionar Proveedor', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              ),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: sups.length,
                                  itemBuilder: (c, i) => ListTile(
                                    leading: const Icon(PhosphorIconsRegular.buildings),
                                    title: Text(sups[i]['company_name'] ?? sups[i]['name']),
                                    onTap: () {
                                      setState(() {
                                        _supplierId = sups[i]['id'];
                                        _supplierName = sups[i]['company_name'] ?? sups[i]['name'];
                                      });
                                      Navigator.pop(ctx);
                                    },
                                  ),
                                ),
                              ),
                            ],
                          )
                        )
                      );
                    },
                  ),
                  AppSelectField(
                    label: 'Fecha Crédito',
                    value: "${_creditDate.day}/${_creditDate.month}/${_creditDate.year}",
                    placeholder: 'Seleccionar fecha',
                    icon: PhosphorIconsRegular.calendar,
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _creditDate,
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (d != null) setState(() => _creditDate = d);
                    },
                  ),
                  AppSelectField(
                    label: 'Fecha Límite (Opcional)',
                    value: _dueDate == null ? null : "${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}",
                    placeholder: 'Sin límite',
                    icon: PhosphorIconsRegular.clock,
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 30)),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (d != null) setState(() => _dueDate = d);
                    },
                  ),
                  AppField.money(
                    label: 'Monto total',
                    controller: _amountController,
                    required: true,
                  ),
                  AppField(
                    label: 'Concepto',
                    controller: _conceptController,
                    required: true,
                    icon: PhosphorIconsRegular.textAa,
                  ),
                  AppButton(
                    label: 'Crear registro',
                    loading: _isSaving,
                    onPressed: _saveDebt,
                    icon: PhosphorIconsRegular.floppyDisk,
                  ),
                ],
              ),
            ),
          ),
        ),
        
        payablesAsync.when(
          loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator())),
          error: (e, s) => SliverFillRemaining(child: Center(child: Text('Error: $e'))),
          data: (debts) {
            final pending = debts.where((d) => d['status'] != 'PAID').toList();
            final paid = debts.where((d) => d['status'] == 'PAID').toList();
            
            return SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index == 0) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Text('Créditos pendientes', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                    );
                  }
                  
                  if (index <= pending.length) {
                    final d = pending[index - 1];
                    final total = double.tryParse(d['total_amount']?.toString() ?? '1') ?? 1;
                    final paidAmt = double.tryParse(d['paid_amount']?.toString() ?? '0') ?? 0;
                    final progress = (paidAmt / total).clamp(0.0, 1.0);
                    
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(d['contact_name'] ?? 'Proveedor', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('\$${d['total_amount']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              ],
                            ),
                            Text(d['concept'] ?? '', style: const TextStyle(color: Colors.grey)),
                            if (d['due_date'] != null)
                              Text('Límite: ${d['due_date']}', style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(value: progress, minHeight: 6, borderRadius: BorderRadius.circular(4), backgroundColor: Colors.grey.withValues(alpha: 0.2), color: const Color(0xFF334155)),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Pagado: \$${d['paid_amount']}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w600)),
                                Text('Resta: \$${d['balance']}', style: const TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.w700)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => _showPaymentDetails(d),
                                    child: const Text('Detalle'),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(minimumSize: const Size(0, 48)),
                                    onPressed: () => _addPayment(d),
                                    child: const Text('Abonar'),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    );
                  }
                  
                  final paidIndex = index - pending.length - 1;
                  if (paidIndex == 0) {
                    return const Padding(
                      padding: EdgeInsets.only(left: 16.0, right: 16.0, top: 24.0, bottom: 8.0),
                      child: Text('Créditos finalizados', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                    );
                  }
                  
                  if (paidIndex <= paid.length) {
                    final d = paid[paidIndex - 1];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        leading: const Icon(Icons.check_circle, color: Color(0xFF059669)),
                        title: Text(d['contact_name'] ?? 'Proveedor', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(d['concept'] ?? ''),
                        trailing: Text('\$${d['total_amount']}', style: const TextStyle(color: Colors.grey, decoration: TextDecoration.lineThrough)),
                        onTap: () => _showPaymentDetails(d),
                      ),
                    );
                  }
                  
                  return const SizedBox(height: 80); // padding at bottom
                },
                childCount: pending.length + paid.length + 3,
              ),
            );
          },
        ),
      ],
    ),
    );
  }
}
