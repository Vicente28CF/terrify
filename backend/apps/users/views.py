from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.throttling import LoginRateThrottle, RegisterRateThrottle, RefreshRateThrottle

from .email_service import send_verification_email, send_welcome_email
from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, UserUpdateSerializer
from .tasks import send_verification_email_task, send_welcome_email_task


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email_task.delay(user.pk)
        return Response(
            {
                "message": "Cuenta creada. Revisa tu email para verificarla.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            }
        )


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TokenRefreshSerializer
    throttle_classes = [RefreshRateThrottle]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "El refresh token es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Refresh token invalido o expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Token requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response(
                {"detail": "Token invalido o expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.email_verification_sent_at:
            expiry = user.email_verification_sent_at + timedelta(hours=24)
            if timezone.now() > expiry:
                return Response(
                    {"detail": "El enlace expiro. Solicita uno nuevo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.email_verified = True
        user.is_verified = True
        user.email_verification_token = None
        user.save(update_fields=["email_verified", "is_verified", "email_verification_token"])

        send_welcome_email_task.delay(user.pk)

        return Response({"detail": "Cuenta verificada correctamente."})


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                {"detail": "Email requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Si el email existe, recibiras un enlace."})

        if user.email_verified:
            return Response({"detail": "Esta cuenta ya esta verificada."})

        if user.email_verification_sent_at:
            wait_until = user.email_verification_sent_at + timedelta(minutes=2)
            if timezone.now() < wait_until:
                return Response(
                    {"detail": "Espera 2 minutos antes de solicitar otro enlace."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        send_verification_email_task.delay(user.pk)
        return Response({"detail": "Si el email existe, recibiras un enlace."})


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
