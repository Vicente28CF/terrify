from decimal import Decimal

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from ..filters import HECTARE_IN_M2, TerrenoFilterSet
from ..models import Terreno


TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "terrify-filter-tests",
    }
}


class TerrenoFilterSetTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="filters-owner@test.com",
            full_name="Filter Owner",
            password="TerrifyPassSegura28",
        )
        self.residential = Terreno.objects.create(
            user=self.owner,
            title="Lote residencial con servicios",
            description="Descripcion amplia de un lote residencial completo para venta.",
            price=Decimal("1500000.00"),
            area_m2=Decimal("250.00"),
            municipio="Zapopan",
            estado="Jalisco",
            land_use=Terreno.LandUse.RESIDENTIAL,
            property_type=Terreno.PropertyType.TITLED,
            has_water=True,
            has_electricity=True,
            has_drainage=True,
            has_paved_road=True,
            accepts_financing=True,
            down_payment_amount=Decimal("100000.00"),
        )
        self.agricultural = Terreno.objects.create(
            user=self.owner,
            title="Hectarea agricola ejidal",
            description="Descripcion amplia de un terreno agricola de gran superficie.",
            price=Decimal("3000000.00"),
            area_m2=Decimal("20000.00"),
            municipio="Tlaquepaque",
            estado="Jalisco",
            land_use=Terreno.LandUse.AGRICULTURAL,
            property_type=Terreno.PropertyType.EJIDO,
            accepts_financing=False,
        )
        self.commercial = Terreno.objects.create(
            user=self.owner,
            title="Local comercial en escritura",
            description="Descripcion amplia de un terreno comercial en proceso de escritura.",
            price=Decimal("5000000.00"),
            area_m2=Decimal("500.00"),
            municipio="Zapopan",
            estado="Jalisco",
            land_use=Terreno.LandUse.COMMERCIAL,
            property_type=Terreno.PropertyType.DEED_PENDING,
            has_water=True,
            accepts_financing=True,
        )

    def _titles(self, **data):
        return set(
            TerrenoFilterSet(data=data, queryset=Terreno.objects.all())
            .qs.values_list("title", flat=True)
        )

    def test_filter_by_land_use(self):
        result = self._titles(land_use="agricultural")
        self.assertEqual(result, {self.agricultural.title})

    def test_filter_by_property_type(self):
        result = self._titles(property_type="ejido")
        self.assertEqual(result, {self.agricultural.title})

    def test_filter_by_has_water(self):
        result = self._titles(has_water="true")
        self.assertEqual(result, {self.residential.title, self.commercial.title})

    def test_filter_by_service_booleans_are_combined_with_and(self):
        result = self._titles(has_water="true", has_electricity="true", has_drainage="true")
        self.assertEqual(result, {self.residential.title})

    def test_filter_by_accepts_financing(self):
        result = self._titles(accepts_financing="true")
        self.assertEqual(result, {self.residential.title, self.commercial.title})

    def test_filter_by_min_and_max_price(self):
        result = self._titles(min_price="1500000", max_price="3000000")
        self.assertEqual(result, {self.residential.title, self.agricultural.title})

    def test_filter_by_area_in_square_meters(self):
        result = self._titles(min_area="300")
        self.assertEqual(result, {self.agricultural.title, self.commercial.title})

    def test_area_unit_hectare_converts_input_to_square_meters(self):
        result = self._titles(min_area="2", area_unit="hectare")
        self.assertEqual(result, {self.agricultural.title})

        result = self._titles(max_area="1", area_unit="hectare")
        self.assertEqual(result, {self.residential.title, self.commercial.title})

    def test_area_unit_m2_keeps_values_unchanged(self):
        result = self._titles(min_area="2", area_unit="m2")
        self.assertEqual(result, {self.residential.title, self.agricultural.title, self.commercial.title})

    def test_all_filters_combine_with_and(self):
        result = self._titles(
            municipio="Zapopan",
            land_use="residential",
            has_paved_road="true",
            accepts_financing="true",
            min_price="1000000",
            max_price="2000000",
        )
        self.assertEqual(result, {self.residential.title})

    def test_invalid_land_use_choice_is_rejected(self):
        filterset = TerrenoFilterSet(
            data={"land_use": "mineria"}, queryset=Terreno.objects.all()
        )
        self.assertFalse(filterset.is_valid())

    def test_invalid_area_unit_is_rejected(self):
        filterset = TerrenoFilterSet(
            data={"area_unit": "acre"}, queryset=Terreno.objects.all()
        )
        self.assertFalse(filterset.is_valid())

    def test_municipio_filter_still_works(self):
        result = self._titles(municipio="Tlaquepaque")
        self.assertEqual(result, {self.agricultural.title})

    def test_hectare_constant(self):
        self.assertEqual(HECTARE_IN_M2, Decimal("10000"))


@override_settings(CACHES=TEST_CACHES)
class TerrenoFilterApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="filter-api-owner@test.com",
            full_name="Filter API Owner",
            password="TerrifyPassSegura28",
        )
        self.cheap_per_m2 = Terreno.objects.create(
            user=self.owner,
            title="Terreno barato por metro",
            description="Descripcion amplia de un terreno con el metro cuadrado mas barato.",
            price=Decimal("3000000.00"),
            area_m2=Decimal("20000.00"),
            municipio="Tlaquepaque",
            estado="Jalisco",
            land_use=Terreno.LandUse.AGRICULTURAL,
            accepts_financing=True,
            down_payment_amount=Decimal("150000.00"),
        )
        self.premium_per_m2 = Terreno.objects.create(
            user=self.owner,
            title="Terreno premium por metro",
            description="Descripcion amplia de un terreno con el metro cuadrado mas caro.",
            price=Decimal("5000000.00"),
            area_m2=Decimal("250.00"),
            municipio="Zapopan",
            estado="Jalisco",
            land_use=Terreno.LandUse.RESIDENTIAL,
        )
        self.mid_per_m2 = Terreno.objects.create(
            user=self.owner,
            title="Terreno intermedio por metro",
            description="Descripcion amplia de un terreno con precio intermedio por metro.",
            price=Decimal("2000000.00"),
            area_m2=Decimal("500.00"),
            municipio="Zapopan",
            estado="Jalisco",
            land_use=Terreno.LandUse.COMMERCIAL,
            accepts_financing=True,
        )

    def test_ordering_by_price_per_m2_ascending(self):
        response = self.client.get(
            reverse("terrenos-list"), {"ordering": "price_per_m2"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(
            titles,
            [
                self.cheap_per_m2.title,
                self.mid_per_m2.title,
                self.premium_per_m2.title,
            ],
        )

    def test_ordering_by_price_per_m2_descending(self):
        response = self.client.get(
            reverse("terrenos-list"), {"ordering": "-price_per_m2"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(
            titles,
            [
                self.premium_per_m2.title,
                self.mid_per_m2.title,
                self.cheap_per_m2.title,
            ],
        )

    def test_new_filters_work_through_api_with_pagination(self):
        response = self.client.get(
            reverse("terrenos-list"),
            {
                "land_use": "agricultural",
                "accepts_financing": "true",
                "area_unit": "hectare",
                "min_area": "1",
                "ordering": "price_per_m2",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], self.cheap_per_m2.title)
        self.assertIn("results", response.data)

    def test_list_returns_payment_facility_label(self):
        response = self.client.get(reverse("terrenos-list"), {"search": "barato por metro"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0]
        self.assertTrue(item["accepts_financing"])
        self.assertEqual(item["payment_facility_label"], "Enganche desde $150,000")

    def test_list_returns_null_payment_facility_label_without_down_payment(self):
        response = self.client.get(reverse("terrenos-list"), {"search": "intermedio por metro"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0]
        self.assertTrue(item["accepts_financing"])
        self.assertIsNone(item["payment_facility_label"])

    def test_list_exposes_new_terrain_fields(self):
        response = self.client.get(reverse("terrenos-list"), {"search": "barato por metro"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0]
        self.assertEqual(item["land_use"], "agricultural")
        self.assertEqual(item["area_unit"], "m2")
        self.assertIn("property_type", item)
        self.assertIn("has_water", item)
        self.assertIn("has_electricity", item)
        self.assertIn("has_drainage", item)
        self.assertIn("has_paved_road", item)
        self.assertIn("down_payment_amount", item)
