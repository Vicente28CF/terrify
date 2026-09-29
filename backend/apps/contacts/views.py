import logging

from django.db.models import Max, Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.throttling import ContactRateThrottle, MessageRateThrottle

from .models import ContactRequest, Message
from .serializers import (
    ContactRequestCreateSerializer,
    ContactRequestListSerializer,
    ContactRequestStatusSerializer,
    MessageCreateSerializer,
    MessageSerializer,
)
from .tasks import send_contact_notification_task, send_reply_notification_task


logger = logging.getLogger(__name__)


class ContactRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    http_method_names = ["get", "post", "patch"]

    def get_queryset(self):
        queryset = (
            ContactRequest.objects.select_related("terreno", "buyer", "terreno__user")
            .prefetch_related("messages")
            .annotate(
                last_msg_body=Max("messages__body"),
                last_msg_created=Max("messages__created_at"),
            )
            .order_by("-created_at")
        )
        queryset = queryset.filter(terreno__user=self.request.user)

        status_filter = self.request.query_params.get("status")
        notification_filter = self.request.query_params.get("notification_status")
        search = self.request.query_params.get("search")

        if status_filter in {
            ContactRequest.Status.PENDING,
            ContactRequest.Status.READ,
            ContactRequest.Status.REPLIED,
        }:
            queryset = queryset.filter(status=status_filter)

        if notification_filter in {
            ContactRequest.NotificationStatus.PENDING,
            ContactRequest.NotificationStatus.SENT,
            ContactRequest.NotificationStatus.FAILED,
        }:
            queryset = queryset.filter(notification_status=notification_filter)

        if search:
            queryset = queryset.filter(
                Q(terreno__title__icontains=search)
                | Q(buyer_name__icontains=search)
                | Q(buyer_email__icontains=search)
                | Q(buyer_phone__icontains=search)
            )

        return queryset.distinct()

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        if self.action == "create":
            return [ContactRateThrottle()]
        return super().get_throttles()

    def get_serializer_class(self):
        if self.action == "create":
            return ContactRequestCreateSerializer
        if self.action == "partial_update":
            return ContactRequestStatusSerializer
        return ContactRequestListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        send_contact_notification_task.delay(str(serializer.instance.id))
        from django.core.cache import cache
        cache.delete(f"unread_count:{request.user.id}")
        data = ContactRequestListSerializer(serializer.instance, context=self.get_serializer_context()).data
        return Response(data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(ContactRequestListSerializer(instance, context=self.get_serializer_context()).data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated], url_path="resend-email")
    def resend_email(self, request, pk=None):
        instance = self.get_object()
        send_contact_notification_task.delay(str(instance.id))
        instance.refresh_from_db()
        return Response(ContactRequestListSerializer(instance, context=self.get_serializer_context()).data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated], url_path="mine")
    def mine(self, request):
        """Lista todas las solicitudes de contacto donde el usuario es comprador o vendedor."""
        user = request.user
        queryset = (
            ContactRequest.objects.select_related("terreno", "buyer", "terreno__user")
            .prefetch_related("messages")
            .annotate(
                last_msg_body=Max("messages__body"),
                last_msg_created=Max("messages__created_at"),
            )
            .filter(Q(buyer=user) | Q(terreno__user=user))
            .order_by("-created_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter in {
            ContactRequest.Status.PENDING,
            ContactRequest.Status.READ,
            ContactRequest.Status.REPLIED,
        }:
            queryset = queryset.filter(status=status_filter)

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(terreno__title__icontains=search)
                | Q(buyer_name__icontains=search)
                | Q(buyer_email__icontains=search)
                | Q(buyer_phone__icontains=search)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ContactRequestListSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = ContactRequestListSerializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated], url_path="unread-count")
    def unread_count(self, request):
        """Cuenta solicitudes con status 'pending' o 'replied' donde el usuario participa."""
        from django.core.cache import cache
        cache_key = f"unread_count:{request.user.id}"
        count = cache.get(cache_key)
        if count is None:
            user = request.user
            count = ContactRequest.objects.filter(
                Q(buyer=user) | Q(terreno__user=user),
                status__in=[ContactRequest.Status.PENDING, ContactRequest.Status.REPLIED],
            ).count()
            cache.set(cache_key, count, timeout=30)
        return Response({"count": count})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """Marca una solicitud de contacto como leída."""
        contact = self.get_object()
        if contact.status in [ContactRequest.Status.PENDING, ContactRequest.Status.REPLIED]:
            contact.status = ContactRequest.Status.READ
            contact.save(update_fields=["status"])
            from django.core.cache import cache
            cache.delete(f"unread_count:{request.user.id}")
        return Response(ContactRequestListSerializer(contact, context=self.get_serializer_context()).data)


class MessageViewSet(viewsets.GenericViewSet, mixins.CreateModelMixin, mixins.ListModelMixin):
    permission_classes = [permissions.IsAuthenticated]

    def get_throttles(self):
        if self.action == "create":
            return [MessageRateThrottle()]
        return super().get_throttles()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_contact_request(self):
        contact_id = self.kwargs["contact_pk"]
        user = self.request.user
        # Solo el comprador o el vendedor pueden ver/escribir mensajes
        return ContactRequest.objects.get(
            Q(buyer=user) | Q(terreno__user=user),
            id=contact_id
        )

    def get_queryset(self):
        contact = self.get_contact_request()
        return Message.objects.filter(contact_request=contact)

    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["contact_request"] = self.get_contact_request()
        return context

    def create(self, request, *args, **kwargs):
        contact = self.get_contact_request()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        if message.sender_role == Message.SenderRole.SELLER:
            contact.status = ContactRequest.Status.REPLIED
        elif message.sender_role == Message.SenderRole.BUYER:
            contact.status = ContactRequest.Status.PENDING
        contact.save(update_fields=["status"])

        send_reply_notification_task.delay(str(contact.id), str(message.id))

        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )
