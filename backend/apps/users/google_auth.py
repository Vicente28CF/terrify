from django.conf import settings
from django.utils.crypto import get_random_string
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import GoogleAuthSerializer, UserSerializer


def get_tokens_for_user(user: User):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "La autenticacion con Google no esta configurada."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {"detail": "Token de Google invalido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not idinfo.get("email_verified", False):
            return Response(
                {"detail": "La cuenta de Google no tiene un email verificado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = User.objects.normalize_email(idinfo.get("email", ""))
        google_id = idinfo.get("sub")
        full_name = (idinfo.get("name") or "").strip()

        if not email:
            return Response(
                {"detail": "No se pudo obtener el email de Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not google_id:
            return Response(
                {"detail": "No se pudo validar la identidad de Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        defaults = {
            "full_name": full_name or email.split("@")[0],
            "google_id": google_id,
            "is_active": True,
            "is_verified": True,
            "password": get_random_string(32),
        }

        user, created = User.objects.get_or_create(email=email, defaults=defaults)

        if not created:
            if not user.is_active:
                return Response(
                    {"detail": "Esta cuenta esta desactivada."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            fields_to_update: list[str] = []

            if user.google_id and user.google_id != google_id:
                return Response(
                    {"detail": "Esta cuenta ya esta vinculada a otra cuenta de Google."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not user.google_id:
                user.google_id = google_id
                fields_to_update.append("google_id")

            if not user.full_name and full_name:
                user.full_name = full_name
                fields_to_update.append("full_name")

            if not user.is_verified:
                user.is_verified = True
                fields_to_update.append("is_verified")

            if fields_to_update:
                user.save(update_fields=fields_to_update)

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "tokens": tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
