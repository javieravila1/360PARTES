import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../providers/categories_provider.dart';
import '../providers/brands_provider.dart';
import '../providers/inventory_provider.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

class ProductFormScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product;
  
  const ProductFormScreen({super.key, this.product});

  @override
  ConsumerState<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends ConsumerState<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _costController = TextEditingController();
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();

  String? _selectedCategoryId;
  String? _selectedCategoryName;

  String? _selectedBrandId;
  String? _selectedBrandName;

  bool _trackInventory = true;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      final p = widget.product!;
      _nameController.text = p['name'] ?? '';
      _skuController.text = p['sku'] ?? '';
      _costController.text = (p['cost_price'] ?? '').toString();
      _priceController.text = (p['selling_price'] ?? '').toString();
      _stockController.text = (p['current_stock'] ?? '').toString();
      _selectedCategoryId = p['category_id']?.toString();
      _selectedBrandId = p['brand_id']?.toString();
      _trackInventory = p['track_inventory'] ?? true;
      
      // We don't have the category and brand names easily here, 
      // but they will be fetched in build and we can look them up or just say 'Seleccionado'.
      // For now, let's just leave it as 'Seleccionado' so the user knows.
      if (_selectedCategoryId != null) _selectedCategoryName = 'Categoría Actual';
      if (_selectedBrandId != null) _selectedBrandName = 'Marca Actual';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _costController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor, selecciona una categoría')));
      return;
    }
    if (_selectedBrandId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor, selecciona una marca')));
      return;
    }

    final cost = double.tryParse(_costController.text) ?? 0.0;
    final price = double.tryParse(_priceController.text) ?? 0.0;
    
    if (price < cost) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El precio sugerido no puede ser menor al costo')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final payload = {
        "name": _nameController.text.trim(),
        "sku": _skuController.text.trim(),
        "cost_price": cost,
        "selling_price": price,
        "current_stock": double.tryParse(_stockController.text) ?? 0.0,
        "category_id": _selectedCategoryId,
        "brand_id": _selectedBrandId,
        "track_inventory": _trackInventory,
      };

      if (widget.product == null) {
        await apiClient.post('/products/', data: payload);
      } else {
        await apiClient.put('/products/${widget.product!['id']}', data: payload);
      }
      
      ref.invalidate(inventoryProvider); // Refresca la lista de inventario
      
      setState(() => _isLoading = false);
      
      if (mounted) {
        showModalBottomSheet(
          context: context,
          isDismissible: false,
          enableDrag: false,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          builder: (c) => _SuccessBottomSheet(isEdit: widget.product != null),
        ).then((_) {
          if (mounted) Navigator.pop(context);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al guardar: $e')));
      }
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSelectionSheet(String title, AsyncValue<List<dynamic>> providerValue, Function(String id, String name) onSelected) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          height: 400,
          child: Column(
            children: [
              Text('Seleccionar $title', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: providerValue.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Center(child: Text('Error: $err')),
                  data: (items) {
                    if (items.isEmpty) {
                      return Center(child: Text('No hay $title registrados. Crea uno desde la web por ahora.'));
                    }
                    return ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return ListTile(
                          title: Text(item['name']),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            onSelected(item['id'].toString(), item['name']);
                            Navigator.pop(context);
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

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final brandsAsync = ref.watch(brandsProvider);

    return Scaffold(
      backgroundColor: FormColors.of(context).subtle,
      appBar: AppBar(
        title: Text(widget.product != null ? 'Editar Producto' : 'Nuevo Producto'),
        backgroundColor: FormColors.of(context).surface,
        scrolledUnderElevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    FormSection(
                      title: 'Información Básica',
                      icon: PhosphorIconsRegular.info,
                      children: [
                        AppField(
                          label: 'Nombre del producto',
                          controller: _nameController,
                          required: true,
                          icon: PhosphorIconsRegular.tag,
                        ),
                        AppField(
                          label: 'Código / SKU',
                          controller: _skuController,
                          required: true,
                          icon: PhosphorIconsRegular.barcode,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    FormSection(
                      title: 'Precios e Inventario',
                      icon: PhosphorIconsRegular.money,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: AppField.money(
                                label: 'Costo',
                                controller: _costController,
                                required: true,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: AppField.money(
                                label: 'Precio Sugerido',
                                controller: _priceController,
                                required: true,
                              ),
                            ),
                          ],
                        ),
                        AppField(
                          label: 'Stock Inicial',
                          controller: _stockController,
                          required: true,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          icon: PhosphorIconsRegular.package,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    FormSection(
                      title: 'Clasificación',
                      icon: PhosphorIconsRegular.list,
                      children: [
                        AppSelectField(
                          label: 'Categoría',
                          value: _selectedCategoryName,
                          placeholder: 'Seleccionar Categoría',
                          required: true,
                          onTap: () => _showSelectionSheet('Categoría', categoriesAsync, (id, name) {
                            setState(() {
                              _selectedCategoryId = id;
                              _selectedCategoryName = name;
                            });
                          }),
                        ),
                        AppSelectField(
                          label: 'Marca',
                          value: _selectedBrandName,
                          placeholder: 'Seleccionar Marca',
                          required: true,
                          onTap: () => _showSelectionSheet('Marca', brandsAsync, (id, name) {
                            setState(() {
                              _selectedBrandId = id;
                              _selectedBrandName = name;
                            });
                          }),
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Controlar inventario', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                          value: _trackInventory,
                          activeThumbColor: FormColors.success,
                          onChanged: (val) => setState(() => _trackInventory = val),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          FormActionBar(
            child: AppButton(
              label: 'Guardar Producto',
              onPressed: _submit,
              loading: _isLoading,
              icon: PhosphorIconsRegular.floppyDisk,
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessBottomSheet extends StatefulWidget {
  final bool isEdit;
  const _SuccessBottomSheet({this.isEdit = false});

  @override
  State<_SuccessBottomSheet> createState() => _SuccessBottomSheetState();
}

class _SuccessBottomSheetState extends State<_SuccessBottomSheet> with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _scale = CurvedAnimation(parent: _anim, curve: Curves.elasticOut);
    _anim.forward();
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) Navigator.pop(context);
    });
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      alignment: Alignment.center,
      child: ScaleTransition(
        scale: _scale,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 100),
            const SizedBox(height: 16),
            Text(widget.isEdit ? '¡Producto Actualizado!' : '¡Producto Creado!', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green)),
          ],
        ),
      ),
    );
  }
}
