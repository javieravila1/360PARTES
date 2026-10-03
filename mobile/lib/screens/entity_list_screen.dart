import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

enum EntityType { customers, suppliers, categories, brands }

class EntityListScreen extends ConsumerStatefulWidget {
  final EntityType entityType;
  
  const EntityListScreen({super.key, required this.entityType});

  @override
  ConsumerState<EntityListScreen> createState() => _EntityListScreenState();
}

class _EntityListScreenState extends ConsumerState<EntityListScreen> {
  List<dynamic> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchItems();
  }

  String get _title {
    switch (widget.entityType) {
      case EntityType.customers: return 'Clientes';
      case EntityType.suppliers: return 'Proveedores';
      case EntityType.categories: return 'Categorías';
      case EntityType.brands: return 'Marcas';
    }
  }

  String get _endpoint {
    switch (widget.entityType) {
      case EntityType.customers: return '/contacts/customers';
      case EntityType.suppliers: return '/contacts/suppliers';
      case EntityType.categories: return '/categories/';
      case EntityType.brands: return '/brands/';
    }
  }

  Future<void> _fetchItems() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiClient.get(_endpoint);
      if (mounted) setState(() => _items = res.data);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showAddDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController(); // Usado para phone/desc
    bool isSaving = false;

    showFormSheet(
      context: context,
      title: 'Nuevo $_title',
      builder: (c, setModalState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppField(
              label: widget.entityType == EntityType.suppliers ? 'Nombre Empresa' : 'Nombre',
              controller: nameCtrl,
              required: true,
            ),
            const SizedBox(height: 16),
            AppField(
              label: (widget.entityType == EntityType.categories || widget.entityType == EntityType.brands) 
                  ? 'Descripción (Opcional)' 
                  : 'Teléfono (Opcional)',
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
                  Map<String, dynamic> data = {};
                  if (widget.entityType == EntityType.categories || widget.entityType == EntityType.brands) {
                    data = {"name": nameCtrl.text.trim(), "description": descCtrl.text.trim()};
                  } else if (widget.entityType == EntityType.customers) {
                    data = {"name": nameCtrl.text.trim(), "phone": descCtrl.text.trim()};
                  } else if (widget.entityType == EntityType.suppliers) {
                    data = {"company_name": nameCtrl.text.trim(), "phone": descCtrl.text.trim()};
                  }

                  await apiClient.post(_endpoint, data: data);
                  if (!c.mounted) return;
                  Navigator.pop(c);
                  if (!mounted) return;
                  _fetchItems();
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
      },
    );
  }

  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Filter items based on search query
    final filteredItems = _items.where((item) {
      final name = (item['name'] ?? item['company_name'] ?? '').toString().toLowerCase();
      final sub = (item['description'] ?? item['phone'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery) || sub.contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(_title, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Buscar $_title...',
                prefixIcon: const Icon(PhosphorIconsRegular.magnifyingGlass),
              ),
            ),
          ),
          
          const SizedBox(height: 8),

          // List
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : filteredItems.isEmpty 
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIconsRegular.tray, size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text('No se encontraron $_title', style: const TextStyle(color: Colors.grey, fontSize: 16)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16).copyWith(bottom: 100),
                    itemCount: filteredItems.length,
                    separatorBuilder: (c, i) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final item = filteredItems[i];
                      final name = item['name'] ?? item['company_name'] ?? 'Desconocido';
                      final sub = item['description'] ?? item['phone'] ?? '';
                      
                      final IconData iconData = widget.entityType == EntityType.categories
                          ? PhosphorIconsRegular.tag
                          : (widget.entityType == EntityType.brands ? PhosphorIconsRegular.bookmarks : PhosphorIconsRegular.users);
                      final muted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
                      final initial = name.toString().trim().isEmpty ? '?' : name.toString().trim()[0].toUpperCase();
                      final isContact = widget.entityType == EntityType.customers || widget.entityType == EntityType.suppliers;

                      return Material(
                        color: isDark ? const Color(0xFF111827) : Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
                        ),
                        clipBehavior: Clip.antiAlias,
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            leading: Container(
                              width: 46,
                              height: 46,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: isContact
                                  ? Text(initial, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155)))
                                  : Icon(iconData, color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155), size: 22),
                            ),
                            title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                            subtitle: sub.isNotEmpty
                                ? Padding(
                                    padding: const EdgeInsets.only(top: 3.0),
                                    child: Text(sub, style: TextStyle(color: muted, fontSize: 13)),
                                  )
                                : null,
                            trailing: Icon(PhosphorIconsRegular.caretRight, size: 18, color: muted),
                            onTap: () {
                              // En el futuro se podría ir a detalle o editar
                            },
                          ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDialog,
        icon: const Icon(PhosphorIconsBold.plus, size: 18),
        label: const Text('Nuevo', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}
