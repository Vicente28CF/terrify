from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.terrenos.models import Terreno
from apps.users.models import User

from .models import ContactRequest
from .services import ContactNotificationServiceError


TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "terrify-tests-contacts",
    }
}


@override_settings(CACHES=TEST_CACHES)
class ContactRequestApiTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller@test.com",
            full_name="Seller User",
            password="TerrifyPassSegura28",
        )
        self.buyer = User.objects.create_user(
            email="buyer@test.com",
            full_name="Buyer User",
            password="TerrifyPassSegura28",
            phone="3311112233",
        )
        self.other_seller = User.objects.create_user(
            email="other-seller@test.com",
            full_name="Other Seller",
            password="TerrifyPassSegura28",
        )
        self.terreno = Terreno.objects.create(
            user=self.seller,
            title="Terreno para contacto",
            description="Descripcion completa para habilitar una solicitud de contacto valida.",
            price=Decimal("1300000.00"),
            area_m2=Decimal("220.00"),
            municipio="Zapopan",
            estado="Jalisco",
            status=Terreno.Status.ACTIVE,
        )
        self.contact_request = ContactRequest.objects.create(
            terreno=self.terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Hola, me interesa este terreno y quiero coordinar una visita esta semana.",
        )

    def test_create_contact_requires_authentication(self):
        response = self.client.post(
            reverse("contact-requests-list"),
            {
                "terreno_slug": self.terreno.slug,
                "message": "Hola, me interesa este terreno y quiero mas informacion pronto.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_buyer_can_create_contact(self):
        self.client.force_authenticate(self.buyer)

        with patch("apps.contacts.views.send_contact_notification_task") as notify_mock:
            response = self.client.post(
                reverse("contact-requests-list"),
                {
                    "terreno_slug": self.terreno.slug,
                    "message": "Hola, me interesa este terreno y quiero saber si sigue disponible.",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactRequest.objects.filter(terreno=self.terreno).count(), 2)
        notify_mock.delay.assert_called_once()

    def test_contact_creation_survives_notification_failure(self):
        self.client.force_authenticate(self.buyer)

        with patch(
            "apps.contacts.views.send_contact_notification_task",
        ):
            response = self.client.post(
                reverse("contact-requests-list"),
                {
                    "terreno_slug": self.terreno.slug,
                    "message": "Hola, me interesa este terreno y quiero saber si sigue disponible.",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactRequest.objects.filter(terreno=self.terreno).count(), 2)

    @patch("apps.contacts.services.resend.Emails.send", return_value={"id": "email_123"})
    @override_settings(RESEND_API_KEY="re_test_key")
    def test_notification_service_marks_contact_as_sent(self, send_mock):
        from .services import send_contact_request_notification

        contact_request = ContactRequest.objects.create(
            terreno=self.terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Hola, me interesa este terreno y quiero coordinar una visita esta semana.",
        )

        send_contact_request_notification(contact_request)

        contact_request.refresh_from_db()
        self.assertEqual(contact_request.notification_status, ContactRequest.NotificationStatus.SENT)
        self.assertIsNotNone(contact_request.notification_sent_at)
        self.assertEqual(contact_request.notification_error, "")
        send_mock.assert_called_once()

    @patch("apps.contacts.services.resend.Emails.send", side_effect=Exception("boom"))
    @override_settings(RESEND_API_KEY="re_test_key")
    def test_notification_service_marks_contact_as_failed(self, send_mock):
        from .services import send_contact_request_notification

        contact_request = ContactRequest.objects.create(
            terreno=self.terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Hola, me interesa este terreno y quiero coordinar una visita esta semana.",
        )

        with self.assertRaises(ContactNotificationServiceError):
            send_contact_request_notification(contact_request)

        contact_request.refresh_from_db()
        self.assertEqual(contact_request.notification_status, ContactRequest.NotificationStatus.FAILED)
        self.assertIsNone(contact_request.notification_sent_at)
        self.assertTrue(contact_request.notification_error)
        send_mock.assert_called_once()

    @override_settings(RESEND_API_KEY="")
    def test_notification_service_marks_contact_as_failed_when_resend_is_not_configured(self):
        from .services import send_contact_request_notification

        contact_request = ContactRequest.objects.create(
            terreno=self.terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Hola, me interesa este terreno y quiero coordinar una visita esta semana.",
        )

        response = send_contact_request_notification(contact_request)

        contact_request.refresh_from_db()
        self.assertIsNone(response)
        self.assertEqual(contact_request.notification_status, ContactRequest.NotificationStatus.FAILED)
        self.assertEqual(contact_request.notification_error, "RESEND_API_KEY no configurada.")

    @override_settings(RESEND_API_KEY="re_test_key", RESEND_TEST_TO_EMAIL="")
    def test_notification_service_marks_contact_as_failed_when_seller_email_is_missing(self):
        from .services import send_contact_request_notification

        self.seller.email = ""
        self.seller.save(update_fields=["email"])

        contact_request = ContactRequest.objects.create(
            terreno=self.terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Hola, me interesa este terreno y quiero coordinar una visita esta semana.",
        )

        response = send_contact_request_notification(contact_request)

        contact_request.refresh_from_db()
        self.assertIsNone(response)
        self.assertEqual(contact_request.notification_status, ContactRequest.NotificationStatus.FAILED)
        self.assertEqual(contact_request.notification_error, "El vendedor no tiene email disponible.")

    @patch("apps.contacts.views.send_contact_notification_task")
    def test_resend_email_endpoint_triggers_notification_task(self, task_mock):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("contact-requests-resend-email", kwargs={"pk": self.contact_request.pk}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.contact_request.id))
        task_mock.delay.assert_called_once_with(str(self.contact_request.id))

    def test_user_cannot_contact_own_terreno(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            reverse("contact-requests-list"),
            {
                "terreno_slug": self.terreno.slug,
                "message": "Quiero contactarme a mi mismo desde este anuncio para probar.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seller_lists_only_own_contact_requests(self):
        other_terreno = Terreno.objects.create(
            user=self.other_seller,
            title="Terreno ajeno",
            description="Descripcion completa para otro terreno del sistema en venta activa.",
            price=Decimal("840000.00"),
            area_m2=Decimal("170.00"),
            municipio="Tonala",
            estado="Jalisco",
            status=Terreno.Status.ACTIVE,
        )
        ContactRequest.objects.create(
            terreno=other_terreno,
            buyer=self.buyer,
            buyer_name="Buyer User",
            buyer_email="buyer@test.com",
            buyer_phone="3311112233",
            message="Solicitud para otro vendedor que no debe mezclarse en el listado.",
        )

        self.client.force_authenticate(self.seller)
        response = self.client.get(reverse("contact-requests-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.contact_request.id))

    def test_only_seller_can_update_contact_status(self):
        self.client.force_authenticate(self.other_seller)
        response = self.client.patch(
            reverse("contact-requests-detail", kwargs={"pk": self.contact_request.pk}),
            {"status": "read"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_seller_can_update_contact_status(self):
        self.client.force_authenticate(self.seller)
        response = self.client.patch(
            reverse("contact-requests-detail", kwargs={"pk": self.contact_request.pk}),
            {"status": "read"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact_request.refresh_from_db()
        self.assertEqual(self.contact_request.status, ContactRequest.Status.READ)
