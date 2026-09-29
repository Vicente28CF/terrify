from django.utils.html import strip_tags
from rest_framework import serializers

from apps.terrenos.models import Terreno

from .filters import scan_message
from .models import ContactRequest, Message


class ContactRequestCreateSerializer(serializers.ModelSerializer):
    terreno_slug = serializers.SlugRelatedField(
        source="terreno",
        slug_field="slug",
        queryset=Terreno.objects.filter(status=Terreno.Status.ACTIVE),
    )

    class Meta:
        model = ContactRequest
        fields = ("terreno_slug", "buyer_name", "buyer_email", "buyer_phone", "message")
        extra_kwargs = {
            "buyer_name": {"required": False},
            "buyer_email": {"required": False},
            "buyer_phone": {"required": False},
        }

    def validate_message(self, value):
        clean_value = value.strip()
        if len(clean_value) < 20:
            raise serializers.ValidationError("El mensaje debe tener al menos 20 caracteres.")
        return clean_value

    def validate(self, attrs):
        request = self.context["request"]
        terreno = attrs["terreno"]

        if terreno.user_id == request.user.id:
            raise serializers.ValidationError("No puedes contactar por un terreno propio.")

        attrs["buyer_name"] = attrs.get("buyer_name") or request.user.full_name
        attrs["buyer_email"] = attrs.get("buyer_email") or request.user.email
        attrs["buyer_phone"] = attrs.get("buyer_phone") or request.user.phone
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return ContactRequest.objects.create(buyer=request.user, **validated_data)


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("body",)

    def validate_body(self, value):
        clean = strip_tags(value.strip())
        if len(clean) < 2:
            raise serializers.ValidationError("El mensaje es muy corto.")
        if len(clean) > 1000:
            raise serializers.ValidationError("Máximo 1000 caracteres.")
        return clean

    def create(self, validated_data):
        request     = self.context["request"]
        contact     = self.context["contact_request"]
        is_seller   = contact.terreno.user_id == request.user.id
        sender_role = Message.SenderRole.SELLER if is_seller else Message.SenderRole.BUYER

        # Escanear por contenido sospechoso
        is_flagged, flag_reason = scan_message(validated_data["body"])

        return Message.objects.create(
            contact_request=contact,
            sender=request.user,
            sender_role=sender_role,
            body=validated_data["body"],
            is_flagged=is_flagged,
            flag_reason=flag_reason,
        )


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine     = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "sender_role", "sender_name", "body", "is_flagged", "created_at", "is_mine")

    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.full_name or obj.sender.email.split("@")[0]
        return "Usuario"

    def get_is_mine(self, obj):
        request = self.context.get("request")
        if request and obj.sender_id:
            return obj.sender_id == request.user.id
        return False


class ContactRequestListSerializer(serializers.ModelSerializer):
    terreno      = serializers.SerializerMethodField()
    messages     = MessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ContactRequest
        fields = (
            "id",
            "terreno",
            "buyer_name",
            "buyer_email",
            "buyer_phone",
            "message",
            "status",
            "notification_status",
            "notification_sent_at",
            "notification_error",
            "created_at",
            "messages",
            "last_message",
        )

    def get_terreno(self, obj):
        return {"title": obj.terreno.title, "slug": obj.terreno.slug}

    def get_last_message(self, obj):
        body = getattr(obj, "last_msg_body", None)
        created_at = getattr(obj, "last_msg_created", None)
        if body and created_at:
            return {"body": body[:80], "created_at": created_at}
        return None


class ContactRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = ("status",)
