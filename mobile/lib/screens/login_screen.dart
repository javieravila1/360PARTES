import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../providers/auth_provider.dart';
import '../widgets/form_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _remember = true;
  String? _error;

  static const _rememberKey = 'remember_email';

  @override
  void initState() {
    super.initState();
    _loadRememberedEmail();
  }

  Future<void> _loadRememberedEmail() async {
    try {
      final saved = await ApiClient.storage.read(key: _rememberKey);
      if (saved != null && saved.isNotEmpty && mounted) {
        setState(() => _emailController.text = saved);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _friendlyError(String? raw) {
    final msg = (raw ?? '').toLowerCase();
    if (msg.contains('incorrect') || msg.contains('invalid') || msg.contains('credencial') || msg.contains('password')) {
      return 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.';
    }
    if (msg.contains('conexión') || msg.contains('connection')) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión a internet.';
    }
    if (msg.contains('inactive') || msg.contains('inactivo')) {
      return 'Tu cuenta está inactiva. Contacta al administrador de tu negocio.';
    }
    return raw ?? 'No se pudo iniciar sesión.';
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final success = await ref.read(authProvider.notifier).login(email, _passwordController.text);

    try {
      if (_remember) {
        await ApiClient.storage.write(key: _rememberKey, value: email);
      } else {
        await ApiClient.storage.delete(key: _rememberKey);
      }
    } catch (_) {}

    if (!success && mounted) {
      setState(() => _error = _friendlyError(ref.read(authProvider).error));
    }
  }

  void _showForgotPassword() {
    context.push('/forgot-password');
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final c = FormColors.of(context);
    final isWide = MediaQuery.of(context).size.width >= 600;

    final form = AutofillGroup(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Marca
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: c.border),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child: Image.asset('lib/public/image.png', width: 40, height: 40, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('360PARTES',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: 1.2, color: c.text)),
                    Text('Gestión comercial', style: TextStyle(fontSize: 12, color: c.muted)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 40),

            // Encabezado
            Text('Inicia sesión',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.8, color: c.text)),
            const SizedBox(height: 8),
            Text(
              'Accede a la cuenta de tu negocio para gestionar inventario, ventas y gastos.',
              style: TextStyle(fontSize: 14.5, height: 1.45, color: c.muted),
            ),
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
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email, AutofillHints.username],
              validator: (v) {
                final value = (v ?? '').trim();
                if (value.isEmpty) return 'Ingresa tu correo electrónico';
                if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)) return 'Ingresa un correo válido';
                return null;
              },
            ),
            const SizedBox(height: 18),
            AppField(
              label: 'Contraseña',
              controller: _passwordController,
              hint: '••••••••',
              icon: PhosphorIconsRegular.lockSimple,
              obscure: _obscure,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              onSubmitted: (_) => _submit(),
              validator: (v) => (v == null || v.isEmpty) ? 'Ingresa tu contraseña' : null,
              suffix: IconButton(
                tooltip: _obscure ? 'Mostrar contraseña' : 'Ocultar contraseña',
                icon: Icon(_obscure ? PhosphorIconsRegular.eye : PhosphorIconsRegular.eyeSlash, size: 20, color: c.muted),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            const SizedBox(height: 14),

            // Recordarme / Olvidé
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => setState(() => _remember = !_remember),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: Checkbox(
                              value: _remember,
                              onChanged: (v) => setState(() => _remember = v ?? false),
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              visualDensity: VisualDensity.compact,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                              side: BorderSide(color: c.muted, width: 1.4),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text('Recordar', style: TextStyle(fontSize: 13.5, color: c.label, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Flexible(
                  child: TextButton(
                    onPressed: _showForgotPassword,
                    style: TextButton.styleFrom(
                      foregroundColor: c.text,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      minimumSize: const Size(0, 32),
                    ),
                    child: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text('¿Olvidaste tu contraseña?',
                          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 26),

            AppButton(
              label: 'Iniciar sesión',
              icon: PhosphorIconsBold.signIn,
              loading: authState.isLoading,
              onPressed: _submit,
            ),
            const SizedBox(height: 28),

            Row(
              children: [
                Expanded(child: Divider(color: c.border)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('¿Nuevo en 360PARTES?', style: TextStyle(fontSize: 12.5, color: c.muted)),
                ),
                Expanded(child: Divider(color: c.border)),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Solicita acceso al administrador de tu negocio o regístrate desde el panel web.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, height: 1.45, color: c.muted),
            ),
          ],
        ),
      ),
    );

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    Expanded(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 420),
                            child: TweenAnimationBuilder<double>(
                              tween: Tween(begin: 0, end: 1),
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeOutCubic,
                              builder: (context, v, child) => Opacity(
                                opacity: v,
                                child: Transform.translate(offset: Offset(0, 12 * (1 - v)), child: child),
                              ),
                              child: isWide
                                  ? Container(
                                      padding: const EdgeInsets.all(32),
                                      decoration: BoxDecoration(
                                        color: c.surface,
                                        borderRadius: BorderRadius.circular(24),
                                        border: Border.all(color: c.border),
                                      ),
                                      child: form,
                                    )
                                  : form,
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Pie
                    Padding(
                      padding: const EdgeInsets.only(bottom: 18, top: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIconsRegular.shieldCheck, size: 14, color: c.muted),
                          const SizedBox(width: 6),
                          Text('Conexión segura  ·  © ${DateTime.now().year} 360PARTES',
                              style: TextStyle(fontSize: 12, color: c.muted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
