from decimal import Decimal
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from ..models import Terreno, TerrenoImage
from ..services import TerrainImageServiceError


TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "terrify-tests",
    }
}


@override_settings(CACHES=TEST_CACHES)
class TerrenoApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@test.com",
            full_name="Owner User",
            password="TerrifyPassSegura28",
        )
        self.other_user = User.objects.create_user(
            email="other@test.com",
            full_name="Other User",
            password="TerrifyPassSegura28",
        )
        self.active_terreno = Terreno.objects.create(
            user=self.owner,
            title="Terreno Activo",
            description="Descripcion suficientemente amplia para un terreno activo en venta.",
            price=Decimal("1500000.00"),
            area_m2=Decimal("250.00"),
            municipio="Zapopan",
            estado="Jalisco",
            status=Terreno.Status.ACTIVE,
        )
        self.paused_terreno = Terreno.objects.create(
            user=self.owner,
            title="Terreno Pausado",
            description="Descripcion suficientemente amplia para un terreno pausado en panel privado.",
            price=Decimal("980000.00"),
            area_m2=Decimal("180.00"),
            municipio="Tonala",
            estado="Jalisco",
            status=Terreno.Status.PAUSED,
        )
        TerrenoImage.objects.create(
            terreno=self.active_terreno,
            cloudinary_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
            cloudinary_id="sample",
            order=0,
            is_cover=True,
        )

    def test_public_list_returns_only_active_terrenos(self):
        response = self.client.get(reverse("terrenos-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["slug"], self.active_terreno.slug)

    def test_public_detail_increments_views(self):
        response = self.client.get(reverse("terrenos-detail", kwargs={"slug": self.active_terreno.slug}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.active_terreno.refresh_from_db()
        self.assertEqual(self.active_terreno.views_count, 1)

    def test_owner_can_create_terreno(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse("terrenos-list"),
            {
                "title": "Terreno Nuevo",
                "description": "Descripcion completa para crear un nuevo terreno desde la API.",
                "price": "1200000.00",
                "area_m2": "210.00",
                "municipio": "Tlaquepaque",
                "estado": "Jalisco",
                "status": "active",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Terreno.objects.filter(title="Terreno Nuevo", user=self.owner).exists())

    def test_owner_can_create_terreno_with_terrain_attributes(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse("terrenos-list"),
            {
                "title": "Lote con servicios",
                "description": "Descripcion completa de un lote con servicios para venta.",
                "price": "1200000.00",
                "area_m2": "210.00",
                "municipio": "Tlaquepaque",
                "estado": "Jalisco",
                "status": "active",
                "land_use": "residential",
                "property_type": "titled",
                "has_water": True,
                "has_electricity": True,
                "has_drainage": True,
                "has_paved_road": True,
                "accepts_financing": True,
                "down_payment_amount": "80000.00",
                "area_unit": "m2",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        terreno = Terreno.objects.get(title="Lote con servicios")
        self.assertEqual(terreno.land_use, Terreno.LandUse.RESIDENTIAL)
        self.assertEqual(terreno.property_type, Terreno.PropertyType.TITLED)
        self.assertTrue(terreno.has_water)
        self.assertTrue(terreno.has_electricity)
        self.assertTrue(terreno.has_drainage)
        self.assertTrue(terreno.has_paved_road)
        self.assertTrue(terreno.accepts_financing)
        self.assertEqual(terreno.down_payment_amount, Decimal("80000.00"))
        self.assertEqual(response.data["payment_facility_label"], "Enganche desde $80,000")

    def test_create_terreno_rejects_invalid_land_use(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse("terrenos-list"),
            {
                "title": "Uso de suelo invalido",
                "description": "Descripcion completa de un terreno con uso de suelo invalido.",
                "price": "900000.00",
                "area_m2": "180.00",
                "municipio": "Tlaquepaque",
                "estado": "Jalisco",
                "status": "active",
                "land_use": "mineria",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_update_terrain_attributes(self):
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            reverse("terrenos-detail", kwargs={"slug": self.active_terreno.slug}),
            {
                "land_use": "commercial",
                "property_type": "ejido",
                "has_paved_road": True,
                "accepts_financing": True,
                "down_payment_amount": "50000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.active_terreno.refresh_from_db()
        self.assertEqual(self.active_terreno.land_use, Terreno.LandUse.COMMERCIAL)
        self.assertEqual(self.active_terreno.property_type, Terreno.PropertyType.EJIDO)
        self.assertTrue(self.active_terreno.has_paved_road)
        self.assertTrue(self.active_terreno.accepts_financing)
        self.assertEqual(self.active_terreno.down_payment_amount, Decimal("50000.00"))
        self.assertEqual(response.data["payment_facility_label"], "Enganche desde $50,000")

    def test_create_terreno_respects_publish_limit(self):
        limited_user = User.objects.create_user(
            email="limited@test.com",
            full_name="Limited User",
            password="TerrifyPassSegura28",
        )
        for index in range(3):
            Terreno.objects.create(
                user=limited_user,
                title=f"Activo {index}",
                description="Descripcion suficiente para terreno activo contabilizado en limite.",
                price=Decimal("100000.00"),
                area_m2=Decimal("100.00"),
                municipio="Zapopan",
                estado="Jalisco",
                status=Terreno.Status.ACTIVE,
            )

        self.client.force_authenticate(limited_user)
        response = self.client.post(
            reverse("terrenos-list"),
            {
                "title": "Excede limite",
                "description": "Descripcion completa para terreno que excede el limite permitido.",
                "price": "900000.00",
                "area_m2": "160.00",
                "municipio": "Zapopan",
                "estado": "Jalisco",
                "status": "active",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_update_terreno(self):
        self.client.force_authenticate(self.other_user)

        response = self.client.patch(
            reverse("terrenos-detail", kwargs={"slug": self.active_terreno.slug}),
            {"title": "Cambio invalido"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mine_returns_only_authenticated_user_terrenos(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get(reverse("terrenos-mine"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_set_images_rejects_multiple_cover_images(self):
        self.client.force_authenticate(self.owner)

        response = self.client.put(
            reverse("terrenos-set-images", kwargs={"slug": self.active_terreno.slug}),
            {
                "images": [
                    {
                        "cloudinary_url": "https://res.cloudinary.com/demo/image/upload/a.jpg",
                        "cloudinary_id": "a",
                        "order": 0,
                        "is_cover": True,
                    },
                    {
                        "cloudinary_url": "https://res.cloudinary.com/demo/image/upload/b.jpg",
                        "cloudinary_id": "b",
                        "order": 1,
                        "is_cover": True,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_reorder_images_and_change_cover(self):
        extra_image = TerrenoImage.objects.create(
            terreno=self.active_terreno,
            cloudinary_url="https://res.cloudinary.com/demo/image/upload/second.jpg",
            cloudinary_id="second",
            order=1,
            is_cover=False,
        )
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            reverse("terrenos-manage-images", kwargs={"slug": self.active_terreno.slug}),
            {
                "images": [
                    {
                        "id": str(extra_image.id),
                        "order": 0,
                        "is_cover": True,
                    },
                    {
                        "id": str(self.active_terreno.images.get(cloudinary_id="sample").id),
                        "order": 1,
                        "is_cover": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        extra_image.refresh_from_db()
        original_image = self.active_terreno.images.get(cloudinary_id="sample")
        original_image.refresh_from_db()
        self.assertTrue(extra_image.is_cover)
        self.assertEqual(extra_image.order, 0)
        self.assertFalse(original_image.is_cover)
        self.assertEqual(original_image.order, 1)

    @patch("apps.terrenos.services.cloudinary.uploader.destroy")
    def test_owner_can_delete_image_and_reassign_cover(self, destroy_mock):
        extra_image = TerrenoImage.objects.create(
            terreno=self.active_terreno,
            cloudinary_url="https://res.cloudinary.com/demo/image/upload/second.jpg",
            cloudinary_id="second",
            order=1,
            is_cover=False,
        )
        self.client.force_authenticate(self.owner)

        response = self.client.delete(
            reverse("terrenos-manage-images", kwargs={"slug": self.active_terreno.slug}),
            {"image_id": str(self.active_terreno.images.get(cloudinary_id="sample").id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(TerrenoImage.objects.filter(cloudinary_id="sample").exists())
        extra_image.refresh_from_db()
        self.assertTrue(extra_image.is_cover)
        self.assertEqual(extra_image.order, 0)
        destroy_mock.assert_called_once_with("sample", resource_type="image")

    @patch(
        "apps.terrenos.views.upload_terrain_image",
        side_effect=TerrainImageServiceError("No se pudo subir una de las imagenes a Cloudinary."),
    )
    def test_upload_images_returns_validation_error_when_cloudinary_upload_fails(self, upload_mock):
        self.client.force_authenticate(self.owner)

        file = SimpleUploadedFile(
            "terreno.jpg",
            (
                b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
                b"\xff\xdb\x00C\x00"
            ),
            content_type="image/jpeg",
        )
        response = self.client.post(
            reverse("terrenos-upload-images", kwargs={"slug": self.active_terreno.slug}),
            {"images": [file]},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["images"],
            "No se pudo subir una de las imagenes a Cloudinary.",
        )
        upload_mock.assert_called_once()

    @patch("apps.terrenos.services.cloudinary.uploader.destroy", side_effect=Exception("boom"))
    def test_delete_image_returns_validation_error_when_cloudinary_delete_fails(self, destroy_mock):
        self.client.force_authenticate(self.owner)
        image_id = str(self.active_terreno.images.get(cloudinary_id="sample").id)

        response = self.client.delete(
            reverse("terrenos-manage-images", kwargs={"slug": self.active_terreno.slug}),
            {"image_id": image_id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(TerrenoImage.objects.filter(id=image_id).exists())
        destroy_mock.assert_called_once_with("sample", resource_type="image")
