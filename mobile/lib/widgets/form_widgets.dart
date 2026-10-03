import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

/// Paleta compartida para formularios.
class FormColors {
  final bool isDark;
  const FormColors(this.isDark);
  factory FormColors.of(BuildContext context) =>
      FormColors(Theme.of(context).brightness == Brightness.dark);

  Color get surface => isDark ? const Color(0xFF111827) : Colors.white;
  Color get subtle => isDark ? const Color(0xFF1F2A3D) : const Color(0xFFF1F5F9);
  Color get border => isDark ? const Color(0xFF273244) : const Color(0xFFE2E8F0);
  Color get text => isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);
  Color get label => isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155);
  Color get muted => isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
  static const danger = Color(0xFFB91C1C);
  static const success = Color(0xFF059669);
}

/// Campo de texto con etiqueta superior (estilo SaaS profesional).
class AppField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? hint;
  final String? helper;
  final IconData? icon;
  final Widget? suffix;
  final String? prefixText;
  final bool obscure;
  final bool required;
  final bool autofocus;
  final int maxLines;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final Iterable<String>? autofillHints;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  const AppField({
    super.key,
    required this.label,
    this.controller,
    this.hint,
    this.helper,
    this.icon,
    this.suffix,
    this.prefixText,
    this.obscure = false,
    this.required = false,
    this.autofocus = false,
    this.maxLines = 1,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.autofillHints,
    this.validator,
    this.onChanged,
    this.onSubmitted,
  });

  /// Campo numérico de dinero.
  factory AppField.money({
    Key? key,
    required String label,
    TextEditingController? controller,
    String? helper,
    bool required = false,
    String? Function(String?)? validator,
    TextInputAction? textInputAction,
  }) =>
      AppField(
        key: key,
        label: label,
        controller: controller,
        hint: '0',
        helper: helper,
        prefixText: '\$ ',
        required: required,
        validator: validator,
        textInputAction: textInputAction,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
      );

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FieldLabel(label, required: required),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          autofocus: autofocus,
          maxLines: obscure ? 1 : maxLines,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          inputFormatters: inputFormatters,
          autofillHints: autofillHints,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: c.text),
          validator: validator ??
              (required
                  ? (v) => (v == null || v.trim().isEmpty) ? 'Este campo es obligatorio' : null
                  : null),
          decoration: InputDecoration(
            hintText: hint,
            prefixText: prefixText,
            prefixStyle: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: c.muted),
            prefixIcon: icon == null ? null : Icon(icon, size: 20, color: c.muted),
            suffixIcon: suffix,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
            errorStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 6),
          Text(helper!, style: TextStyle(fontSize: 12, color: c.muted)),
        ],
      ],
    );
  }
}

class FieldLabel extends StatelessWidget {
  final String text;
  final bool required;
  const FieldLabel(this.text, {super.key, this.required = false});

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);
    return Text.rich(
      TextSpan(children: [
        TextSpan(text: text),
        if (required)
          const TextSpan(text: ' *', style: TextStyle(color: FormColors.danger)),
      ]),
      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.label, letterSpacing: 0.1),
    );
  }
}

/// Selector con apariencia de campo (para fechas, listas, etc.).
class AppSelectField extends StatelessWidget {
  final String label;
  final String? value;
  final String placeholder;
  final IconData icon;
  final VoidCallback onTap;
  final bool required;

  const AppSelectField({
    super.key,
    required this.label,
    required this.value,
    required this.placeholder,
    required this.onTap,
    this.icon = PhosphorIconsRegular.caretDown,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);
    final hasValue = value != null && value!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FieldLabel(label, required: required),
        const SizedBox(height: 8),
        Material(
          color: c.surface,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: c.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      hasValue ? value! : placeholder,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: hasValue ? FontWeight.w500 : FontWeight.w400,
                        color: hasValue ? c.text : c.muted,
                      ),
                    ),
                  ),
                  Icon(icon, size: 18, color: c.muted),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Tarjeta de sección con título y descripción.
class FormSection extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final List<Widget> children;

  const FormSection({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
            child: Row(
              children: [
                if (icon != null) ...[
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: c.subtle, borderRadius: BorderRadius.circular(10)),
                    child: Icon(icon, size: 18, color: c.label),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: c.text)),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle!, style: TextStyle(fontSize: 12.5, color: c.muted)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: c.border),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: _spaced(children, 16),
            ),
          ),
        ],
      ),
    );
  }

  static List<Widget> _spaced(List<Widget> items, double gap) {
    final out = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      if (i > 0) out.add(SizedBox(height: gap));
      out.add(items[i]);
    }
    return out;
  }
}

/// Botón primario con estado de carga.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool outlined;
  final Color? color;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.outlined = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = outlined ? scheme.onSurface : (color != null ? Colors.white : scheme.onPrimary);
    final child = loading
        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
              Text(label),
            ],
          );
    if (outlined) {
      return OutlinedButton(onPressed: loading ? null : onPressed, child: child);
    }
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: color == null
          ? null
          : ElevatedButton.styleFrom(backgroundColor: color, foregroundColor: Colors.white),
      child: child,
    );
  }
}

/// Barra inferior fija para acciones de formulario.
class FormActionBar extends StatelessWidget {
  final Widget child;
  const FormActionBar({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = FormColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.border)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SafeArea(top: false, child: child),
    );
  }
}

/// Hoja inferior con formulario (reemplazo profesional de AlertDialog).
Future<T?> showFormSheet<T>({
  required BuildContext context,
  required String title,
  String? subtitle,
  required Widget Function(BuildContext context, StateSetter setState) builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) {
      final c = FormColors.of(ctx);
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: StatefulBuilder(
          builder: (ctx, setState) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: c.text, letterSpacing: -0.3)),
                          if (subtitle != null) ...[
                            const SizedBox(height: 4),
                            Text(subtitle, style: TextStyle(fontSize: 13, color: c.muted)),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(PhosphorIconsRegular.x, size: 20, color: c.muted),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                builder(ctx, setState),
              ],
            ),
          ),
        ),
      );
    },
  );
}

/// Banner de error en línea.
class ErrorBanner extends StatelessWidget {
  final String message;
  const ErrorBanner(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: FormColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: FormColors.danger.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(PhosphorIconsRegular.warningCircle, size: 18, color: FormColors.danger),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message,
                style: const TextStyle(fontSize: 13, color: FormColors.danger, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}
