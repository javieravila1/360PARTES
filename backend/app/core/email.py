import os
from email.message import EmailMessage
import aiosmtplib
from pathlib import Path
from app.core.config import settings

async def send_reset_pin_email(to_email: str, pin: str, user_name: str = "Usuario"):
    # En producción deberías usar las credenciales desde tu .env o settings
    # Ej: settings.SMTP_USER, settings.SMTP_PASSWORD, etc.
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", "360PARTES <noreply@360partes.com>")
    
    if not smtp_user or not smtp_password:
        print(f"⚠️ AVISO: Correos no configurados. El PIN para {to_email} es {pin}")
        return

    msg = EmailMessage()
    msg['Subject'] = "Tu PIN de recuperación de contraseña"
    msg['From'] = smtp_from
    msg['To'] = to_email

    # Leer plantilla HTML
    template_path = Path(__file__).parent.parent / "templates" / "reset_password_pin.html"
    try:
        html_content = template_path.read_text(encoding="utf-8")
        html_content = html_content.replace("{{ reset_pin }}", pin)
        html_content = html_content.replace("{{ user_name }}", user_name)
    except Exception as e:
        html_content = f"<h1>Recuperación de Contraseña</h1><p>Tu PIN es: <b>{pin}</b></p>"

    msg.set_content("Tu cliente de correo no soporta HTML. Tu PIN es: " + pin)
    msg.add_alternative(html_content, subtype='html')

    try:
        if smtp_port == 465:
            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_password,
                use_tls=True
            )
        else:
            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_password,
                start_tls=True
            )
        print(f"✅ Correo enviado exitosamente a {to_email}")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
