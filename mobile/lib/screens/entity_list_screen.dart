import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';

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

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (c, setModalState) {
          return AlertDialog(
            title: Text('Nuevo $_title'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    labelText: widget.entityType == EntityType.suppliers ? 'Nombre Empresa' : 'Nombre',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  decoration: InputDecoration(
                    labelText: (widget.entityType == EntityType.categories || widget.entityType == EntityType.brands) 
                        ? 'Descripción (Opcional)' 
                        : 'Teléfono (Opcional)',
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancelar')),
              ElevatedButton(
                onPressed: isSaving ? null : () async {
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
                    if (mounted) {
                      Navigator.pop(c);
                      _fetchItems();
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  } finally {
                    setModalState(() => isSaving = false);
                  }
                },
                child: isSaving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text('Guardar'),
              ),
            ],
          );
        }
      )
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
                      
                      Color iconColor;
                      IconData iconData;
                      switch (widget.entityType) {
                        case EntityType.customers: iconColor = Colors.blue; iconData = PhosphorIconsRegular.users; break;
                        case EntityType.suppliers: iconColor = Colors.purple; iconData = PhosphorIconsRegular.buildings; break;
                        case EntityType.categories: iconColor = Colors.orange; iconData = PhosphorIconsRegular.tag; break;
                        case EntityType.brands: iconColor = Colors.teal; iconData = PhosphorIconsRegular.bookmarks; break;
                      }
                      
                      return Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))
                          ],
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: iconColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(iconData, color: iconColor),
                          ),
                          title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          subtitle: sub.isNotEmpty 
                              ? Padding(
                                  padding: const EdgeInsets.only(top: 4.0),
                                  child: Text(sub, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                                ) 
                              : null,
                          trailing: Icon(PhosphorIconsRegular.caretRight, color: Colors.grey.shade400),
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
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(PhosphorIconsRegular.plus, color: Colors.white),
        label: Text('Nuevo', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
