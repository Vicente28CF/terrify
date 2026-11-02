"use client";

import { useCallback, useEffect } from "react";
import { useDebounce } from "@/lib/use-debounce";
import { useSyncedState } from "@/lib/use-synced-state";
import { TerrainSearchBar } from "@/components/terrain-search-bar";
import { MoreFiltersDrawer, PROPERTY_TYPE_OPTIONS, SORT_OPTIONS } from "@/components/search/MoreFiltersDrawer";
import { LAND_USE_VALUES } from "@/lib/terreno-options";

export type AreaUnit = "m2" | "hectare";

export type FilterState = {
  search: string;
  precioMax: string;
  precioMin: string;
  areaMin: string;
  areaMax: string;
  areaUnit: AreaUnit;
  ordering: string;
  soloDestacados: boolean;
  terrainType: string;
  servicio: string;
  acceptsFinancing: boolean;
  accesibleParaEmpezar: boolean;
  landUse: string;
  propertyType: string;
  hasWater: boolean;
  hasElectricity: boolean;
  hasDrainage: boolean;
  hasPavedRoad: boolean;
};

type Props = {
  filters: FilterState;
  count: number;
  isLoading: boolean;
  onFiltersChange: (filters: FilterState) => void;
};

export const LAND_USE_OPTIONS = [{ value: "", label: "Todos los usos" }, ...LAND_USE_VALUES];

export const EMPTY_FILTERS: FilterState = {
  search: "",
  precioMax: "",
  precioMin: "",
  areaMin: "",
  areaMax: "",
  areaUnit: "m2",
  ordering: "",
  soloDestacados: false,
  terrainType: "",
  servicio: "",
  acceptsFinancing: false,
  accesibleParaEmpezar: false,
  landUse: "",
  propertyType: "",
  hasWater: false,
  hasElectricity: false,
  hasDrainage: false,
  hasPavedRoad: false,
};

const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  m2: "m²",
  hectare: "ha",
};

function convertAreaValue(value: string, from: AreaUnit, to: AreaUnit): string {
  if (!value || from === to) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  const converted = from === "m2" ? parsed / 10000 : parsed * 10000;
  return String(Math.round(converted * 100) / 100);
}

export function FilterBar({ filters, count, isLoading, onFiltersChange }: Props) {
  const {
    search, precioMax, precioMin, areaMin, areaMax, areaUnit, ordering,
    soloDestacados, terrainType, servicio, acceptsFinancing,
    accesibleParaEmpezar, landUse, propertyType,
    hasWater, hasElectricity, hasDrainage, hasPavedRoad,
  } = filters;

  const update = useCallback(
    (next: Partial<FilterState>) => onFiltersChange({ ...filters, ...next }),
    [filters, onFiltersChange],
  );

  const [localPrecioMax, setLocalPrecioMax] = useSyncedState(precioMax);
  const [localPrecioMin, setLocalPrecioMin] = useSyncedState(precioMin);
  const [localAreaMin, setLocalAreaMin] = useSyncedState(areaMin);
  const [localAreaMax, setLocalAreaMax] = useSyncedState(areaMax);

  const debouncedPrecioMax = useDebounce(localPrecioMax, 500);
  const debouncedPrecioMin = useDebounce(localPrecioMin, 500);
  const debouncedAreaMin = useDebounce(localAreaMin, 500);
  const debouncedAreaMax = useDebounce(localAreaMax, 500);

  useEffect(() => {
    if (debouncedPrecioMax !== precioMax) update({ precioMax: debouncedPrecioMax });
  }, [debouncedPrecioMax, precioMax, update]);
  useEffect(() => {
    if (debouncedPrecioMin !== precioMin) update({ precioMin: debouncedPrecioMin });
  }, [debouncedPrecioMin, precioMin, update]);
  useEffect(() => {
    if (debouncedAreaMin !== areaMin) update({ areaMin: debouncedAreaMin });
  }, [debouncedAreaMin, areaMin, update]);
  useEffect(() => {
    if (debouncedAreaMax !== areaMax) update({ areaMax: debouncedAreaMax });
  }, [debouncedAreaMax, areaMax, update]);

  const handleAreaUnitChange = (nextUnit: AreaUnit) => {
    if (nextUnit === areaUnit) return;
    const nextAreaMin = convertAreaValue(areaMin, areaUnit, nextUnit);
    const nextAreaMax = convertAreaValue(areaMax, areaUnit, nextUnit);
    setLocalAreaMin(nextAreaMin);
    setLocalAreaMax(nextAreaMax);
    update({ areaUnit: nextUnit, areaMin: nextAreaMin, areaMax: nextAreaMax });
  };

  const clearAll = () => {
    setLocalPrecioMax("");
    setLocalPrecioMin("");
    setLocalAreaMin("");
    setLocalAreaMax("");
    onFiltersChange(EMPTY_FILTERS);
  };

  const activeChips: { label: string; key: keyof FilterState; value: unknown }[] = [];
  const areaUnitLabel = AREA_UNIT_LABELS[areaUnit];

  if (soloDestacados) activeChips.push({ label: "Destacados", key: "soloDestacados", value: false });
  if (landUse) {
    const found = LAND_USE_OPTIONS.find((option) => option.value === landUse);
    activeChips.push({ label: found?.label ?? landUse, key: "landUse", value: "" });
  }
  if (terrainType) {
    activeChips.push({ label: `Terreno: ${terrainType}`, key: "terrainType", value: "" });
  }
  if (servicio) activeChips.push({ label: servicio, key: "servicio", value: "" });
  if (propertyType) {
    const found = PROPERTY_TYPE_OPTIONS.find((option) => option.value === propertyType);
    activeChips.push({ label: found?.label ?? propertyType, key: "propertyType", value: "" });
  }
  if (hasWater) activeChips.push({ label: "Agua", key: "hasWater", value: false });
  if (hasElectricity) activeChips.push({ label: "Luz", key: "hasElectricity", value: false });
  if (hasDrainage) activeChips.push({ label: "Drenaje", key: "hasDrainage", value: false });
  if (hasPavedRoad) activeChips.push({ label: "Calle pavimentada", key: "hasPavedRoad", value: false });
  if (acceptsFinancing) activeChips.push({ label: "Facilidades de pago", key: "acceptsFinancing", value: false });
  if (accesibleParaEmpezar) activeChips.push({ label: "Para empezar", key: "accesibleParaEmpezar", value: false });
  if (precioMin) activeChips.push({ label: `Min $${Number(precioMin).toLocaleString()}`, key: "precioMin", value: "" });
  if (precioMax) activeChips.push({ label: `Max $${Number(precioMax).toLocaleString()}`, key: "precioMax", value: "" });
  if (areaMin) activeChips.push({ label: `Min ${areaMin} ${areaUnitLabel}`, key: "areaMin", value: "" });
  if (areaMax) activeChips.push({ label: `Max ${areaMax} ${areaUnitLabel}`, key: "areaMax", value: "" });
  if (ordering) {
    const found = SORT_OPTIONS.find((option) => option.value === ordering);
    activeChips.push({ label: found?.label ?? ordering, key: "ordering", value: "" });
  }

  const hasActiveFilters = activeChips.length > 0 || Boolean(search);

  const hasAdvancedFilters = Boolean(
    terrainType ||
      servicio ||
      propertyType ||
      acceptsFinancing ||
      hasWater ||
      hasElectricity ||
      hasDrainage ||
      hasPavedRoad ||
      ordering,
  );

  return (
    <div className="mb-8 space-y-4">
      <TerrainSearchBar
        value={search}
        isLoading={isLoading}
        onSubmit={(term) => update({ search: term })}
      />

      {/* ── Barra principal: siempre visible ── */}
      <div className="rounded-2xl border border-line/60 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Rango de precio */}
          <div className="min-w-0 lg:w-64">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-stone/50">Precio</p>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-line/60 bg-white px-3 py-2">
                <span className="text-xs text-stone">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={localPrecioMin}
                  onChange={(e) => setLocalPrecioMin(e.target.value)}
                  aria-label="Precio minimo"
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-stone/40"
                />
              </div>
              <span className="text-stone">-</span>
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-line/60 bg-white px-3 py-2">
                <span className="text-xs text-stone">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={localPrecioMax}
                  onChange={(e) => setLocalPrecioMax(e.target.value)}
                  aria-label="Precio maximo"
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-stone/40"
                />
              </div>
            </div>
          </div>

          {/* Superficie con toggle m² / ha */}
          <div className="min-w-0 lg:w-72">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase text-stone/50">Superficie</p>
              <div className="flex items-center gap-1 rounded-full border border-line/60 bg-sand/50 p-0.5">
                {(["m2", "hectare"] as AreaUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleAreaUnitChange(unit)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all ${
                      areaUnit === unit
                        ? "bg-ink text-white"
                        : "text-stone hover:text-ink"
                    }`}
                  >
                    {AREA_UNIT_LABELS[unit]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-line/60 bg-white px-3 py-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={localAreaMin}
                  onChange={(e) => setLocalAreaMin(e.target.value)}
                  aria-label={`Superficie minima en ${areaUnitLabel}`}
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-stone/40"
                />
                <span className="text-xs text-stone">{areaUnitLabel}</span>
              </div>
              <span className="text-stone">-</span>
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-line/60 bg-white px-3 py-2">
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={localAreaMax}
                  onChange={(e) => setLocalAreaMax(e.target.value)}
                  aria-label={`Superficie maxima en ${areaUnitLabel}`}
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-stone/40"
                />
                <span className="text-xs text-stone">{areaUnitLabel}</span>
              </div>
            </div>
          </div>

          {/* Uso de suelo */}
          <div className="min-w-0 lg:w-56">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-stone/50">Uso de suelo</p>
            <select
              value={landUse}
              onChange={(e) => update({ landUse: e.target.value })}
              aria-label="Uso de suelo"
              className="w-full rounded-xl border border-line/60 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-ink/40"
            >
              {LAND_USE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Chips de filtros rápidos ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Destacados — chip standalone, sin "Todos" al lado */}
        <button
          type="button"
          onClick={() => update({ soloDestacados: !soloDestacados })}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
            soloDestacados
              ? "bg-cta text-text"
              : "border border-line/60 bg-white text-text-muted hover:text-text"
          }`}
        >
          <span aria-hidden="true">⭐</span>
          Destacados
        </button>

        {/* Para empezar */}
        <button
          type="button"
          onClick={() => update({ accesibleParaEmpezar: !accesibleParaEmpezar })}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
            accesibleParaEmpezar
              ? "bg-success text-white"
              : "border border-line/60 bg-white text-text-muted hover:text-text"
          }`}
        >
          <span className="text-xs">🌱</span>
          Para empezar
        </button>

        {/* Mas filtros (drawer) */}
        <MoreFiltersDrawer filters={filters} onFiltersChange={update} triggerClassName={
          hasAdvancedFilters
            ? "border-2 border-primary bg-primary/5 text-primary"
            : "border border-line/60 bg-white text-text-muted hover:text-text"
        } />

        {/* Limpiar — solo visible si hay filtros activos */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-line/60 bg-white px-4 py-2 text-sm font-medium text-stone shadow-sm transition hover:border-ink/30 hover:text-ink"
          >
            Limpiar
          </button>
        )}

        {/* Conteo */}
        <p className="ml-auto text-sm text-stone">
          {isLoading ? "Buscando..." : count === 0 ? "Sin resultados" : `${count} terreno${count !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Chips de filtros activos (resumen de lo que está aplicado) ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip, index) => (
            <button
              key={`${String(chip.key)}-${index}`}
              type="button"
              onClick={() => update({ [chip.key]: chip.value } as Partial<FilterState>)}
              className="flex items-center gap-1.5 rounded-full border border-cta/30 bg-cta/5 px-3 py-1 text-xs font-semibold text-cta transition hover:bg-cta/10"
            >
              {chip.label}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
