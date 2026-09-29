"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";

import { EmptyState } from "@/components/empty-state";
import { TerrainCard } from "@/components/terrain/TerrainCard";
import { TerrainCardSkeleton } from "@/components/terrain-card-skeleton";
import { FilterBar, type FilterState, EMPTY_FILTERS } from "@/components/search/FilterBar";
import { fetchTerrenos, type TerrenoFilters } from "@/lib/api";
import type { Terreno } from "@/lib/types";

function buildApiFilters(filters: FilterState): TerrenoFilters {
  const hasAreaFilter = Boolean(filters.areaMin || filters.areaMax);
  return {
    search: filters.search || undefined,
    precio_max: filters.precioMax ? Number(filters.precioMax) : undefined,
    precio_min: filters.precioMin ? Number(filters.precioMin) : undefined,
    min_area: filters.areaMin ? Number(filters.areaMin) : undefined,
    max_area: filters.areaMax ? Number(filters.areaMax) : undefined,
    area_unit: hasAreaFilter ? filters.areaUnit : undefined,
    is_featured: filters.soloDestacados ? true : undefined,
    ordering: filters.ordering || undefined,
    terrain_type: filters.terrainType || undefined,
    servicio: filters.servicio || undefined,
    land_use: filters.landUse || undefined,
    property_type: filters.propertyType || undefined,
    has_water: filters.hasWater || undefined,
    has_electricity: filters.hasElectricity || undefined,
    has_drainage: filters.hasDrainage || undefined,
    has_paved_road: filters.hasPavedRoad || undefined,
    accepts_financing: filters.acceptsFinancing || undefined,
    accesible_para_empezar: filters.accesibleParaEmpezar || undefined,
  };
}

function readFiltersFromParams(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get("search") ?? searchParams.get("municipio") ?? "",
    precioMax: searchParams.get("precio_max") ?? "",
    precioMin: searchParams.get("precio_min") ?? "",
    areaMin: searchParams.get("area_min") ?? "",
    areaMax: searchParams.get("area_max") ?? "",
    areaUnit: searchParams.get("area_unit") === "hectare" ? "hectare" : "m2",
    ordering: searchParams.get("ordering") ?? "",
    soloDestacados:
      searchParams.get("is_featured") === "true" || searchParams.get("destacados") === "true",
    terrainType: searchParams.get("terrain_type") ?? "",
    servicio: searchParams.get("servicio") ?? "",
    acceptsFinancing: searchParams.get("accepts_financing") === "true",
    accesibleParaEmpezar: searchParams.get("accesible_para_empezar") === "true",
    landUse: searchParams.get("land_use") ?? "",
    propertyType: searchParams.get("property_type") ?? "",
    hasWater: searchParams.get("has_water") === "true",
    hasElectricity: searchParams.get("has_electricity") === "true",
    hasDrainage: searchParams.get("has_drainage") === "true",
    hasPavedRoad: searchParams.get("has_paved_road") === "true",
  };
}

function filtersToQueryString(filters: FilterState): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | boolean | number | undefined) => {
    if (value === undefined || value === "" || value === false || value === 0) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  };
  set("search", filters.search);
  set("precio_max", filters.precioMax);
  set("precio_min", filters.precioMin);
  set("area_min", filters.areaMin);
  set("area_max", filters.areaMax);
  set("area_unit", filters.areaUnit === "hectare" ? "hectare" : "");
  set("ordering", filters.ordering);
  set("is_featured", filters.soloDestacados);
  set("terrain_type", filters.terrainType);
  set("servicio", filters.servicio);
  set("land_use", filters.landUse);
  set("property_type", filters.propertyType);
  set("has_water", filters.hasWater);
  set("has_electricity", filters.hasElectricity);
  set("has_drainage", filters.hasDrainage);
  set("has_paved_road", filters.hasPavedRoad);
  set("accepts_financing", filters.acceptsFinancing);
  set("accesible_para_empezar", filters.accesibleParaEmpezar);
  return params.toString();
}

function filtersAreEmpty(filters: FilterState): boolean {
  return (
    !filters.search &&
    !filters.precioMax &&
    !filters.precioMin &&
    !filters.areaMin &&
    !filters.areaMax &&
    filters.areaUnit === "m2" &&
    !filters.ordering &&
    !filters.soloDestacados &&
    !filters.terrainType &&
    !filters.servicio &&
    !filters.landUse &&
    !filters.propertyType &&
    !filters.hasWater &&
    !filters.hasElectricity &&
    !filters.hasDrainage &&
    !filters.hasPavedRoad &&
    !filters.acceptsFinancing &&
    !filters.accesibleParaEmpezar
  );
}

export function TerrainBrowser({
  initialTerrenos,
  initialHasNextPage,
  initialCount,
}: {
  initialTerrenos: Terreno[];
  initialHasNextPage: boolean;
  initialCount: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const initialFilters = readFiltersFromParams(searchParams);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const isInitialMount = useRef(true);

  const apiFilters = buildApiFilters(filters);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["terrenos", apiFilters, page],
    queryFn: () => fetchTerrenos(page, apiFilters),
    initialData:
      page === 1 && Object.values(apiFilters).every((v) => !v)
        ? { results: initialTerrenos, count: initialCount, next: initialHasNextPage ? "yes" : null, previous: null }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const terrenos = data?.results ?? initialTerrenos;
  const count = data?.count ?? initialCount;
  const hasNextPage = !!data?.next;

  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Sync URL ← filters (after initial mount, no router.push race) ──
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const qs = filtersToQueryString(filters);
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [filters, router]);

  const handleFiltersChange = useCallback(
    (nextFilters: FilterState) => {
      setFilters(nextFilters);
      setPage(1);
    },
    [setPage],
  );

  return (
    <>
      <FilterBar
        filters={filters}
        count={count}
        isLoading={isFetching}
        onFiltersChange={handleFiltersChange}
      />

      {/* ── Results grid ── */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <TerrainCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-semibold text-red-700">No pudimos cargar los terrenos.</p>
            <p className="mt-1 text-xs text-red-500">Verifica tu conexion e intenta de nuevo.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              Reintentar
            </button>
          </div>
        ) : terrenos.length === 0 ? (
          <EmptyState
            message="Sin resultados."
            description="Ajusta los filtros o amplia la busqueda para ver mas terrenos."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {terrenos.map((terreno) => (
              <TerrainCard key={terreno.id} terreno={terreno} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!isLoading && hasNextPage && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className="rounded-full border-2 border-primary px-8 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-40"
            >
              {isFetching ? "Cargando..." : "Mostrar mas"}
            </button>
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {loadError}
          </div>
        )}
      </div>
    </>
  );
}
