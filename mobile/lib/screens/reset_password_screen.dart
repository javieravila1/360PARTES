import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import '../api/api_client.dart';
import '../widgets/form_widgets.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String initialEmail;
  const ResetPasswordScreen({super.key, this.initialEmail = ''});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final _pinController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _pinController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await apiClient.post('/auth/reset-password', data: {
        'email': _emailController.text.trim(),
        'pin': _pinController.text.trim(),
        'new_password': _passwordController.text,
      });
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contraseña actualizada correctamente')),
      );
      context.go('/login');
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Error al restablecer la contraseña. Verifica el PIN.');
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
                Icon(PhosphorIconsRegular.shieldCheck, size: 48, color: c.text),
                const SizedBox(height: 24),
                Text('Nueva Contraseña', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: c.text)),
                const SizedBox(height: 8),
                Text('Ingresa el PIN de 6 dígitos que enviamos a tu correo.', style: TextStyle(fontSize: 14.5, color: c.muted)),
                const SizedBox(height: 32),

                if (_error != null) ...[
                  ErrorBanner(_error!),
                  const SizedBox(height: 20),
                ],

                AppField(
                  label: 'Correo electrónico',
                  controller: _emailController,
                  icon: PhosphorIconsRegular.envelopeSimple,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v == null || v.isEmpty) ? 'Requerido' : null,
                ),
                const SizedBox(height: 18),
                
                AppField(
                  label: 'PIN de seguridad',
                  controller: _pinController,
                  icon: PhosphorIconsRegular.key,
                  keyboardType: TextInputType.number,
                  hint: '------',
                  validator: (v) => (v == null || v.trim().length != 6) ? 'Ingresa el PIN de 6 dígitos' : null,
                ),
                const SizedBox(height: 18),

                AppField(
                  label: 'Nueva contraseña',
                  controller: _passwordController,
                  icon: PhosphorIconsRegular.lockSimple,
                  obscure: _obscure,
                  validator: (v) => (v == null || v.length < 6) ? 'Mínimo 6 caracteres' : null,
                  suffix: IconButton(
                    icon: Icon(_obscure ? PhosphorIconsRegular.eye : PhosphorIconsRegular.eyeSlash, color: c.muted),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                const SizedBox(height: 32),

                AppButton(
                  label: 'Cambiar Contraseña',
                  icon: PhosphorIconsBold.check,
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
