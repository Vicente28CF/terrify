from decimal import Decimal

from django.conf import settings
from django_filters.rest_framework import (
    BooleanFilter,
    CharFilter,
    ChoiceFilter,
    FilterSet,
    NumberFilter,
)

from .models import Terreno


HECTARE_IN_M2 = Decimal("10000")


class TerrenoFilterSet(FilterSet):
    min_price = NumberFilter(field_name="price", lookup_expr="gte")
    max_price = NumberFilter(field_name="price", lookup_expr="lte")
    min_area = NumberFilter(method="filter_min_area")
    max_area = NumberFilter(method="filter_max_area")
    area_unit = ChoiceFilter(choices=Terreno.AreaUnit.choices, method="filter_area_unit")
    land_use = ChoiceFilter(
        field_name="land_use", choices=Terreno.LandUse.choices
    )
    property_type = ChoiceFilter(
        field_name="property_type", choices=Terreno.PropertyType.choices
    )
    has_water = BooleanFilter(field_name="has_water")
    has_electricity = BooleanFilter(field_name="has_electricity")
    has_drainage = BooleanFilter(field_name="has_drainage")
    has_paved_road = BooleanFilter(field_name="has_paved_road")
    accepts_financing = BooleanFilter(field_name="accepts_financing")
    terrain_type = CharFilter(field_name="terrain_type", lookup_expr="iexact")
    servicio = CharFilter(method="filter_by_service")
    accesible_para_empezar = BooleanFilter(method="filter_accesible_para_empezar")

    class Meta:
        model = Terreno
        fields = (
            "municipio", "estado", "is_featured",
            "min_price", "max_price", "min_area", "max_area", "area_unit",
            "land_use", "property_type",
            "has_water", "has_electricity", "has_drainage", "has_paved_road",
            "accepts_financing", "terrain_type", "servicio",
            "accesible_para_empezar",
        )

    def _area_unit_multiplier(self) -> Decimal:
        unit = self.data.get("area_unit") if hasattr(self.data, "get") else None
        if unit == Terreno.AreaUnit.HECTARE:
            return HECTARE_IN_M2
        return Decimal("1")

    def filter_min_area(self, queryset, name, value):
        return queryset.filter(area_m2__gte=value * self._area_unit_multiplier())

    def filter_max_area(self, queryset, name, value):
        return queryset.filter(area_m2__lte=value * self._area_unit_multiplier())

    def filter_area_unit(self, queryset, name, value):
        return queryset

    def filter_by_service(self, queryset, name, value):
        return queryset.filter(nearby_services__contains=[value])

    def filter_accesible_para_empezar(self, queryset, name, value):
        if not value:
            return queryset
        precio_max = settings.TERRIFY_PRECIO_ACCESIBLE_MAX
        area_max = settings.TERRIFY_AREA_ACCESIBLE_MAX
        return queryset.filter(
            price__lte=precio_max,
            area_m2__lte=area_max,
            accepts_financing=True,
        )
