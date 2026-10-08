import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final email = _emailController.text.trim();

    try {
      await apiClient.post('/auth/forgot-password', data: {'email': email});
      if (!mounted) return;
      context.push('/reset-password', extra: email);
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Error al enviar el correo. Intenta nuevamente.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIconsRegular.caretLeft, color: c.text),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(PhosphorIconsRegular.lockKey, size: 48, color: c.text),
                const SizedBox(height: 24),
                Text('Recuperar acceso', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: c.text)),
                const SizedBox(height: 8),
                Text('Ingresa tu correo para recibir un PIN de seguridad.', style: TextStyle(fontSize: 14.5, color: c.muted)),
                const SizedBox(height: 32),

                if (_error != null) ...[
                  ErrorBanner(_error!),
                  const SizedBox(height: 20),
                ],

                AppField(
                  label: 'Correo electrónico',
                  controller: _emailController,
                  hint: 'nombre@empresa.com',
                  icon: PhosphorIconsRegular.envelopeSimple,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    final value = (v ?? '').trim();
                    if (value.isEmpty) return 'Ingresa tu correo';
                    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)) return 'Ingresa un correo válido';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                AppButton(
                  label: 'Enviar PIN',
                  icon: PhosphorIconsBold.paperPlaneRight,
                  loading: _isLoading,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
