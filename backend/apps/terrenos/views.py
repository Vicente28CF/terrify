import logging

from django.core.cache import cache
from django.db import transaction
from django.conf import settings
from django.db.models import Exists, F, OuterRef, Prefetch, Q, Subquery, CharField, Value
from django.db.models.functions import Lower
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import IsOwnerOrReadOnly
from core.throttling import TerrenoMineRateThrottle
from core.cache import get_cached_list, set_cached_list, invalidate_terreno_cache, invalidate_terreno_detail

from .filters import TerrenoFilterSet
from .models import Terreno, TerrenoImage
from .serializers import (
    TerrenoDetailSerializer,
    TerrenoImageBulkSerializer,
    TerrenoImageDeleteSerializer,
    TerrenoImageManageSerializer,
    TerrenoListSerializer,
    TerrenoWriteSerializer,
)
from .services import (
    TerrainImageServiceError,
    delete_terrain_image,
    upload_terrain_image,
)


logger = logging.getLogger(__name__)


class TerrenoViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_class = TerrenoFilterSet
    search_fields = ("title", "description", "municipio", "estado")
    ordering_fields = ("created_at", "price", "area_m2", "views_count", "price_per_m2")
    ordering = ("-is_featured", "-created_at")

    def get_queryset(self):
        image_queryset = TerrenoImage.objects.order_by("order", "created_at")
        queryset = (
            Terreno.objects.select_related("user")
            .prefetch_related(Prefetch("images", queryset=image_queryset))
        )

        if self._is_ordering_by_price_per_m2():
            queryset = queryset.annotate(price_per_m2=F("price") / F("area_m2"))

        if self.action in ("list", "mine", "favorites") and self.request.user.is_authenticated:
            from .models import Favorite
            user_favorites = Favorite.objects.filter(
                user=self.request.user, terreno=OuterRef("pk")
            )
            queryset = queryset.annotate(is_favorited=Exists(user_favorites))
        elif self.action in ("list", "mine", "favorites"):
            from django.db.models import Value
            queryset = queryset.annotate(is_favorited=Value(False))

        if self.action == "mine":
            return queryset.filter(user=self.request.user)

        if self.action in ("create", "update", "partial_update", "destroy", "set_images", "upload_images"):
            return queryset.filter(user=self.request.user)

        if self.action == "retrieve" and self.request.user.is_authenticated:
            return queryset.filter(Q(status=Terreno.Status.ACTIVE) | Q(user=self.request.user))

        if self.request.method in permissions.SAFE_METHODS:
            return queryset.filter(status=Terreno.Status.ACTIVE)

        return queryset

    def _is_ordering_by_price_per_m2(self) -> bool:
        ordering = self.request.query_params.get("ordering", "")
        return any(
            field.strip().lstrip("-") == "price_per_m2"
            for field in ordering.split(",")
            if field.strip()
        )

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            permission_classes = [permissions.AllowAny]
        elif self.action in ("mine", "favorite", "favorites"):
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_throttles(self):
        if self.action == "mine":
            return [TerrenoMineRateThrottle()]
        return super().get_throttles()

    def get_serializer_class(self):
        if self.action in ("list", "mine"):
            return TerrenoListSerializer
        if self.action == "retrieve":
            return TerrenoDetailSerializer
        if self.action == "set_images":
            return TerrenoImageBulkSerializer
        if self.action == "manage_images":
            if self.request.method == "PATCH":
                return TerrenoImageManageSerializer
            if self.request.method == "DELETE":
                return TerrenoImageDeleteSerializer
        return TerrenoWriteSerializer

    def list(self, request, *args, **kwargs):
        cache_params = {
            key: request.query_params.get(key)
            for key in [
                "municipio", "estado", "min_price", "max_price",
                "min_area", "max_area", "area_unit", "ordering", "search", "is_featured",
                "terrain_type", "servicio", "accepts_financing",
                "accesible_para_empezar", "land_use", "property_type",
                "has_water", "has_electricity", "has_drainage", "has_paved_road",
            ]
            if request.query_params.get(key)
        }
        cache_params["page"] = request.query_params.get("page", "1")

        cached_data = get_cached_list("terrenos", cache_params, timeout=60)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            set_cached_list("terrenos", cache_params, response.data, timeout=60)
            return response
        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)
        set_cached_list("terrenos", cache_params, response.data, timeout=60)
        return response

    def perform_create(self, serializer):
        if not self.request.user.can_publish:
            raise PermissionDenied("Has alcanzado tu limite de publicaciones activas.")
        serializer.save(user=self.request.user)
        invalidate_terreno_cache()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        terreno = serializer.instance
        headers = self.get_success_headers(serializer.data)
        data = TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        instance.refresh_from_db()
        invalidate_terreno_cache()
        invalidate_terreno_detail(instance.slug)
        return Response(TerrenoDetailSerializer(instance, context=self.get_serializer_context()).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        slug = instance.slug
        self.perform_destroy(instance)
        invalidate_terreno_cache()
        invalidate_terreno_detail(slug)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly])
    def set_status(self, request, slug=None):
        terreno = self.get_object()
        self.check_object_permissions(request, terreno)
        new_status = request.data.get("status")
        if new_status not in [Terreno.Status.ACTIVE, Terreno.Status.SOLD, Terreno.Status.PAUSED]:
            return Response(
                {"status": "Status inválido. Usa: active, sold, paused"},
                status=status.HTTP_400_BAD_REQUEST
            )
        terreno.status = new_status
        terreno.save(update_fields=["status"])
        invalidate_terreno_cache()
        invalidate_terreno_detail(terreno.slug)
        return Response(TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_authenticated or instance.user_id != request.user.id:
            cache_key = f"terreno_views:{instance.pk}"
            cache.add(cache_key, 0, timeout=None)
            pending_views = cache.incr(cache_key)
            instance.views_count += pending_views
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated], url_path="favorite")
    def favorite(self, request, slug=None):
        terreno = self.get_object()
        from .models import Favorite
        
        if request.method == "POST":
            Favorite.objects.get_or_create(user=request.user, terreno=terreno)
            return Response({"status": "favorited"}, status=status.HTTP_201_CREATED)
            
        elif request.method == "DELETE":
            deleted, _ = Favorite.objects.filter(user=request.user, terreno=terreno).delete()
            if deleted:
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response({"detail": "Favorito no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated], url_path="favorites")
    def favorites(self, request):
        from .models import Favorite
        from django.db.models import Case, When

        favorite_ids = list(Favorite.objects.filter(user=request.user).values_list('terreno_id', flat=True))

        preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(favorite_ids)])

        queryset = self.get_queryset().filter(id__in=favorite_ids).order_by(preserved_order)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TerrenoListSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        serializer = TerrenoListSerializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=True, methods=["put"], permission_classes=[permissions.IsAuthenticated], url_path="images")
    def set_images(self, request, slug=None):
        terreno = self.get_object()
        self.check_object_permissions(request, terreno)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(terreno=terreno)
        terreno.refresh_from_db()
        return Response(
            TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch", "delete"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="images/manage",
    )
    def manage_images(self, request, slug=None):
        terreno = self.get_object()
        self.check_object_permissions(request, terreno)
        serializer = self.get_serializer(
            data=request.data,
            context={**self.get_serializer_context(), "terreno": terreno},
        )
        serializer.is_valid(raise_exception=True)

        if request.method == "PATCH":
            serializer.save(terreno=terreno)
            terreno.refresh_from_db()
            return Response(
                TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data,
                status=status.HTTP_200_OK,
            )

        try:
            self._delete_terreno_image(terreno, serializer.validated_data["image_id"])
        except TerrainImageServiceError as exc:
            raise ValidationError({"image_id": str(exc)}) from exc
        terreno.refresh_from_db()
        return Response(
            TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
        url_path="upload-images",
    )
    def upload_images(self, request, slug=None):
        terreno = self.get_object()
        self.check_object_permissions(request, terreno)

        files = request.FILES.getlist("images")
        if not files:
            raise ValidationError({"images": "Debes enviar al menos una imagen."})

        existing_count = terreno.images.count()
        total_count = existing_count + len(files)
        if total_count > settings.TERRIFY_MAX_TERRAIN_IMAGES:
            raise ValidationError(
                {"images": f"No puedes registrar mas de {settings.TERRIFY_MAX_TERRAIN_IMAGES} imagenes por terreno."}
            )

        next_order = existing_count
        has_cover = terreno.images.filter(is_cover=True).exists()
        uploaded_cloudinary_ids = []

        try:
            for file in files:
                self._validate_image_file(file)
                upload_result = upload_terrain_image(
                    file=file,
                    folder=f"terrify/terrenos/{terreno.slug}",
                )
                uploaded_cloudinary_ids.append(upload_result["public_id"])
                TerrenoImage.objects.create(
                    terreno=terreno,
                    cloudinary_url=upload_result["secure_url"],
                    cloudinary_id=upload_result["public_id"],
                    order=next_order,
                    is_cover=not has_cover and next_order == existing_count,
                )
                next_order += 1
        except TerrainImageServiceError as exc:
            self._cleanup_uploaded_images(uploaded_cloudinary_ids)
            raise ValidationError({"images": str(exc)}) from exc

        terreno.refresh_from_db()
        return Response(
            TerrenoDetailSerializer(terreno, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    def _validate_image_file(self, file):
        if file.size > settings.TERRIFY_MAX_IMAGE_FILE_SIZE:
            raise ValidationError(
                {"images": f"Cada imagen debe pesar menos de {settings.TERRIFY_MAX_IMAGE_FILE_SIZE // (1024 * 1024)} MB."}
            )

        header = file.read(512)
        file.seek(0)
        image_kind = self._detect_image_type(header)
        if image_kind not in {"jpeg", "png", "webp"}:
            raise ValidationError({"images": "Formato de imagen no permitido. Usa JPG, PNG o WEBP."})

    @staticmethod
    def _detect_image_type(header: bytes) -> str | None:
        if len(header) < 4:
            return None
        if header[:2] == b"\xff\xd8":
            return "jpeg"
        if header[:4] == b"\x89PNG\r\n\x1a\n":
            return "png"
        if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
            return "webp"
        return None

    @transaction.atomic
    def _delete_terreno_image(self, terreno, image_id):
        image = terreno.images.get(id=image_id)
        cloudinary_id = image.cloudinary_id
        remaining_images = list(terreno.images.exclude(id=image.id).order_by("order", "created_at"))
        delete_terrain_image(cloudinary_id=cloudinary_id)

        image.delete()

        if remaining_images:
            cover_assigned = False
            for order, remaining_image in enumerate(remaining_images):
                remaining_image.order = order
                remaining_image.is_cover = image.is_cover and order == 0 or (
                    not image.is_cover and remaining_image.is_cover
                )
                if remaining_image.is_cover:
                    cover_assigned = True

            if not cover_assigned:
                remaining_images[0].is_cover = True

            TerrenoImage.objects.bulk_update(remaining_images, ["order", "is_cover"])

    def _cleanup_uploaded_images(self, cloudinary_ids):
        for cloudinary_id in cloudinary_ids:
            try:
                delete_terrain_image(cloudinary_id=cloudinary_id)
            except TerrainImageServiceError:
                logger.warning(
                    "No se pudo limpiar una imagen ya subida a Cloudinary tras fallo parcial. public_id=%s",
                    cloudinary_id,
                )
