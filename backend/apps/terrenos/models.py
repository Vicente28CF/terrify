import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Terreno(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active", "Activo"
        SOLD   = "sold",   "Vendido"
        PAUSED = "paused", "Pausado"

    class LandUse(models.TextChoices):
        RESIDENTIAL  = "residential",  "Residencial"
        COMMERCIAL   = "commercial",   "Comercial"
        AGRICULTURAL = "agricultural", "Agricola"
        INDUSTRIAL   = "industrial",   "Industrial"

    class PropertyType(models.TextChoices):
        TITLED       = "titled",       "Escriturado"
        DEED_PENDING = "deed_pending", "En proceso de escritura"
        EJIDO        = "ejido",        "Ejidal"
        OTHER        = "other",        "Otro"

    class AreaUnit(models.TextChoices):
        M2      = "m2",      "m2"
        HECTARE = "hectare", "Hectarea"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name="terrenos"
                  )
    slug        = models.SlugField(max_length=220, unique=True, editable=False)
    title       = models.CharField(max_length=200)
    description = models.TextField()
    price       = models.DecimalField(max_digits=14, decimal_places=2)
    area_m2     = models.DecimalField(max_digits=10, decimal_places=2)
    municipio   = models.CharField(max_length=100)
    estado      = models.CharField(max_length=100, default="Jalisco")
    nearby_services = models.JSONField(default=list, blank=True)
    terrain_type = models.CharField(max_length=20, blank=True)
    address     = models.CharField(max_length=255, blank=True)
    land_use = models.CharField(
        max_length=20,
        choices=LandUse.choices,
        blank=True,
        default="",
    )
    property_type = models.CharField(
        max_length=20,
        choices=PropertyType.choices,
        blank=True,
        default="",
    )
    has_water = models.BooleanField(default=False)
    has_electricity = models.BooleanField(default=False)
    has_drainage = models.BooleanField(default=False)
    has_paved_road = models.BooleanField(default=False)
    accepts_financing = models.BooleanField(default=False)
    down_payment_amount = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    area_unit = models.CharField(
        max_length=10,
        choices=AreaUnit.choices,
        default=AreaUnit.M2,
    )
    latitude    = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = "terrenos"
        verbose_name        = "Terreno"
        verbose_name_plural = "Terrenos"
        ordering            = ["-is_featured", "-created_at"]
        indexes = [
            models.Index(fields=["municipio"]),
            models.Index(fields=["status"]),
            models.Index(fields=["price"]),
            models.Index(fields=["area_m2"]),
            models.Index(fields=["is_featured", "-created_at"]),
            models.Index(fields=["terrain_type"], name="terreno_terrain_type_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name="terreno_price_positive",
            ),
            models.CheckConstraint(
                check=models.Q(area_m2__gt=0),
                name="terreno_area_positive",
            ),
        ]

    @property
    def es_accesible_para_empezar(self):
        precio_max = Decimal(str(settings.TERRIFY_PRECIO_ACCESIBLE_MAX))
        area_max = Decimal(str(settings.TERRIFY_AREA_ACCESIBLE_MAX))
        return (
            self.price <= precio_max
            and self.area_m2 <= area_max
            and self.accepts_financing
        )

    def __str__(self):
        return f"{self.title} — {self.municipio} (${self.price})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:200] or str(self.id)
            slug = base_slug
            suffix = 1
            while Terreno.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug[:195]}-{suffix}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)


class TerrenoImage(models.Model):

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    terreno        = models.ForeignKey(
                       Terreno,
                       on_delete=models.CASCADE,
                       related_name="images"
                     )
    cloudinary_url = models.URLField(max_length=500)
    cloudinary_id  = models.CharField(max_length=200)
    order          = models.PositiveSmallIntegerField(default=0)
    is_cover       = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "terreno_images"
        ordering = ["order"]

    def __str__(self):
        return f"Imagen {self.order} de {self.terreno.title}"

class Favorite(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    terreno    = models.ForeignKey(Terreno, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "terreno_favorites"
        unique_together = ("user", "terreno")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} favoritó {self.terreno.title}"
