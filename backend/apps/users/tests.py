from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from .models import User
from .views import RegisterView, LoginView
from .google_auth import GoogleAuthView


class AuthApiTests(APITestCase):
    def setUp(self):
        self._patchers = []
        for view_cls in (RegisterView, LoginView, GoogleAuthView):
            p = patch.object(view_cls, "throttle_classes", [])
            p.start()
            self._patchers.append(p)

    def tearDown(self):
        for p in self._patchers:
            p.stop()
    def test_register_returns_message_and_waits_verification(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "nuevo@test.com",
                "full_name": "Nuevo Usuario",
                "phone": "3312345678",
                "password": "TerrifyPassSegura28",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("email", response.data)
        self.assertTrue(User.objects.filter(email="nuevo@test.com").exists())

    def test_login_returns_tokens(self):
        user = User.objects.create_user(
            email="login@test.com",
            full_name="Login User",
            password="TerrifyPassSegura28",
        )

        response = self.client.post(
            reverse("auth-login"),
            {
                "email": user.email,
                "password": "TerrifyPassSegura28",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["tokens"])

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("users-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.users.google_auth.id_token.verify_oauth2_token")
    def test_google_auth_creates_user_and_returns_tokens(self, verify_oauth2_token_mock):
        verify_oauth2_token_mock.return_value = {
            "sub": "google-user-123",
            "email": "google@test.com",
            "email_verified": True,
            "name": "Google User",
        }

        response = self.client.post(
            reverse("auth-google"),
            {"credential": "google-id-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertEqual(response.data["user"]["email"], "google@test.com")
        self.assertTrue(User.objects.filter(email="google@test.com", google_id="google-user-123").exists())

# Create your tests here.
