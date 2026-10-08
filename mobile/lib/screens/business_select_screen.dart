import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import '../api/api_client.dart';
import '../providers/businesses_provider.dart';
import '../widgets/form_widgets.dart';

class BusinessSelectScreen extends ConsumerStatefulWidget {
  const BusinessSelectScreen({super.key});

  @override
  ConsumerState<BusinessSelectScreen> createState() => _BusinessSelectScreenState();
}

class _BusinessSelectScreenState extends ConsumerState<BusinessSelectScreen> {
  List<dynamic> _businesses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBusinesses();
  }

  Future<void> _fetchBusinesses() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiClient.get('/businesses/');
      if (mounted) setState(() => _businesses = res.data);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showBusinessDialog({Map<String, dynamic>? business}) {
    final nameCtrl = TextEditingController(text: business?['name'] ?? '');
    final currencyCtrl = TextEditingController(text: business?['currency'] ?? 'COP');
    bool isSaving = false;
    final isEdit = business != null;

    showFormSheet(
      context: context,
      title: isEdit ? 'Editar Negocio' : 'Nuevo Negocio',
      builder: (c, setModalState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppField(
              label: 'Nombre',
              controller: nameCtrl,
              required: true,
            ),
            const SizedBox(height: 16),
            AppField(
              label: 'Moneda',
              controller: currencyCtrl,
              required: true,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Guardar',
              loading: isSaving,
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                setModalState(() => isSaving = true);
                
                try {
                  final data = {
                    "name": nameCtrl.text.trim(),
                    "currency": currencyCtrl.text.trim()
                  };

                  if (isEdit) {
                    await apiClient.put('/businesses/${business['id']}', data: data);
                  } else {
                    await apiClient.post('/businesses/', data: data);
                  }
                  
                  if (!c.mounted) return;
                  Navigator.pop(c);
                  if (!mounted) return;
                  _fetchBusinesses();
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

  void _showDeleteDialog(Map<String, dynamic> business) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar Negocio', style: TextStyle(color: Colors.red)),
        content: Text('¿Estás seguro de que quieres eliminar ${business['name']}? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await apiClient.delete('/businesses/${business['id']}');
                _fetchBusinesses();
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error al eliminar (solo dueño)')));
              }
            },
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Mis Negocios', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: false,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(16).copyWith(bottom: 100),
            children: [
              const Text('¿Qué negocio quieres administrar?', style: TextStyle(fontSize: 16, color: Colors.grey)),
              const SizedBox(height: 16),
              ..._businesses.map((item) {
                final b = item['business'];
                final role = item['role'];
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0)),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      await ref.read(currentBusinessProvider.notifier).setBusiness(b['id'], b);
                      if (context.mounted) context.go('/');
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(PhosphorIconsRegular.storefront, color: Colors.blue, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(b['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isDark ? Colors.grey[800] : Colors.grey[200],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(role.toString().toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                )
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(PhosphorIconsRegular.pencilSimple, size: 20),
                            onPressed: () => _showBusinessDialog(business: b),
                          ),
                          IconButton(
                            icon: const Icon(PhosphorIconsRegular.trash, color: Colors.red, size: 20),
                            onPressed: () => _showDeleteDialog(b),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              Card(
                margin: const EdgeInsets.only(bottom: 16),
                color: Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0), style: BorderStyle.solid),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _showBusinessDialog(),
                  child: const Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIconsRegular.plus, size: 32, color: Colors.grey),
                        SizedBox(height: 8),
                        Text('Crear Nuevo Negocio', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
    );
  }
}
