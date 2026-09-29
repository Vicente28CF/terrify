import logging

import resend
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_contact_notification_task(self, contact_request_id: str):
    """Envía notificación de nuevo contacto de forma asíncrona."""
    from django.utils.html import escape, linebreaks
    from apps.contacts.models import ContactRequest

    try:
        contact_request = ContactRequest.objects.select_related("terreno", "terreno__user").get(
            pk=contact_request_id
        )
    except ContactRequest.DoesNotExist:
        logger.warning("ContactRequest %s no existe; tarea cancelada.", contact_request_id)
        return

    seller_email = contact_request.terreno.user.email
    recipient_email = settings.RESEND_TEST_TO_EMAIL or seller_email

    if not settings.RESEND_API_KEY:
        logger.info("Resend no configurado; se omite notificacion para contacto %s.", contact_request_id)
        _mark_notification_failed.delay(contact_request_id, "RESEND_API_KEY no configurada.")
        return

    if not recipient_email:
        logger.warning("El terreno %s no tiene email de vendedor; se omite notificacion.", contact_request.terreno_id)
        _mark_notification_failed.delay(contact_request_id, "El vendedor no tiene email disponible.")
        return

    buyer_phone = contact_request.buyer_phone.strip() or "No compartido"
    subject = f"Nuevo contacto para {contact_request.terreno.title}"
    safe_message = linebreaks(escape(contact_request.message.strip()))

    params = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [recipient_email],
        "subject": subject,
        "reply_to": contact_request.buyer_email,
        "html": f"""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
              <h2>Nuevo interes en tu terreno</h2>
              <p>Recibiste una nueva solicitud mediada desde Terrify.</p>
              {f'<p><strong>Modo prueba:</strong> este email fue redirigido a {escape(recipient_email)} para validacion.</p>' if settings.RESEND_TEST_TO_EMAIL else ''}
              <p><strong>Vendedor destino:</strong> {escape(seller_email or 'No disponible')}</p>
              <p><strong>Terreno:</strong> {escape(contact_request.terreno.title)}</p>
              <p><strong>Comprador:</strong> {escape(contact_request.buyer_name)}</p>
              <p><strong>Email:</strong> {escape(contact_request.buyer_email)}</p>
              <p><strong>Telefono:</strong> {escape(buyer_phone)}</p>
              <p><strong>Mensaje:</strong></p>
              <div>{safe_message}</div>
              <p style="margin-top: 24px;">
                Revisa tu panel de vendedor para dar seguimiento y mantener actualizado el estado del contacto.
              </p>
            </div>
        """,
    }

    try:
        resend.Emails.send(params)
        _mark_notification_sent.delay(contact_request_id)
    except Exception as exc:
        logger.exception(
            "Fallo el envio de notificacion Resend para contacto %s hacia %s.",
            contact_request_id,
            recipient_email,
        )
        message = f"Resend error: {str(exc).strip() or 'No se pudo enviar el email.'}"
        _mark_notification_failed.delay(contact_request_id, message)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_reply_notification_task(self, contact_request_id: str, message_id: str):
    """Envía notificación de respuesta de forma asíncrona."""
    from django.utils.html import escape
    from apps.contacts.models import ContactRequest, Message

    try:
        contact_request = ContactRequest.objects.select_related("terreno", "terreno__user").get(
            pk=contact_request_id
        )
        message = Message.objects.get(pk=message_id)
    except (ContactRequest.DoesNotExist, Message.DoesNotExist):
        logger.warning("ContactRequest %s o Message %s no existe; tarea cancelada.", contact_request_id, message_id)
        return

    is_seller_replying = message.sender_role == Message.SenderRole.SELLER

    recipient_email = (
        contact_request.buyer_email if is_seller_replying else contact_request.terreno.user.email
    )
    recipient_email = settings.RESEND_TEST_TO_EMAIL or recipient_email

    if not settings.RESEND_API_KEY or not recipient_email:
        return

    sender_label = "El vendedor" if is_seller_replying else "El comprador"
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")

    params = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [recipient_email],
        "subject": f"Nueva respuesta en Terrify — {contact_request.terreno.title}",
        "html": f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1f1f1f;">{sender_label} te respondio</h2>
            <p style="color: #6a6a6a;">Sobre el terreno: <strong>{escape(contact_request.terreno.title)}</strong></p>
            <div style="background: #f5f5f3; padding: 16px; border-radius: 12px; margin: 16px 0;">
                <p style="color: #1f1f1f; margin: 0;">"{escape(message.body[:200])}..."</p>
            </div>
            <a href="{frontend_url}/mensajes/{contact_request.id}"
               style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                      background: #ff385c; color: white; border-radius: 999px;
                      text-decoration: none; font-weight: bold;">
                Ver conversacion
            </a>
            <p style="margin-top: 24px; color: #9a9a9a; font-size: 12px;">
                Por seguridad, mantén tu conversacion dentro de Terrify.
            </p>
        </div>
        """,
    }

    try:
        resend.Emails.send(params)
    except Exception as exc:
        logger.warning("No se pudo enviar notificacion de respuesta para contacto %s.", contact_request_id)
        raise self.retry(exc=exc)


@shared_task
def _mark_notification_sent(contact_request_id: str):
    """Marca notificación como enviada."""
    from django.utils import timezone
    from apps.contacts.models import ContactRequest

    try:
        ContactRequest.objects.filter(pk=contact_request_id).update(
            notification_status=ContactRequest.NotificationStatus.SENT,
            notification_sent_at=timezone.now(),
            notification_error="",
        )
    except Exception:
        logger.exception("Error marking notification sent for %s", contact_request_id)


@shared_task
def _mark_notification_failed(contact_request_id: str, message: str):
    """Marca notificación como fallida."""
    from apps.contacts.models import ContactRequest

    try:
        ContactRequest.objects.filter(pk=contact_request_id).update(
            notification_status=ContactRequest.NotificationStatus.FAILED,
            notification_sent_at=None,
            notification_error=message[:255],
        )
    except Exception:
        logger.exception("Error marking notification failed for %s", contact_request_id)
