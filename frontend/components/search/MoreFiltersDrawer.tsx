"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  PROPERTY_TYPE_VALUES,
  TERRAIN_TYPE_VALUES,
  NEARBY_SERVICE_VALUES,
  TERRAIN_SERVICE_TOGGLES,
} from "@/lib/terreno-options";

export const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "precio_m2_asc", label: "Precio por m²" },
  { value: "recientes", label: "Mas recientes" },
  { value: "area_asc", label: "Menor superficie" },
  { value: "area_desc", label: "Mayor superficie" },
];

export const PROPERTY_TYPE_OPTIONS = [{ value: "", label: "Cualquiera" }, ...PROPERTY_TYPE_VALUES];

export const TERRAIN_TYPES = TERRAIN_TYPE_VALUES;

export const NEARBY_SERVICES = NEARBY_SERVICE_VALUES.map((option) => option.value);

export const TERRAIN_SERVICES = TERRAIN_SERVICE_TOGGLES;

type FilterValues = {
  ordering: string;
  terrainType: string;
  servicio: string;
  propertyType: string;
  acceptsFinancing: boolean;
  hasWater: boolean;
  hasElectricity: boolean;
  hasDrainage: boolean;
  hasPavedRoad: boolean;
};

type Props = {
  filters: FilterValues;
  onFiltersChange: (next: Partial<FilterValues>) => void;
  triggerClassName?: string;
};

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
        checked
          ? "border-cta bg-cta/10 text-ink"
          : "border-line/60 bg-white text-text-muted hover:border-ink/30 hover:text-ink"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
          checked ? "border-cta bg-cta text-white" : "border-line bg-white"
        }`}
      >
        {checked && (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

export function MoreFiltersDrawer({ filters, onFiltersChange, triggerClassName }: Props) {
  const {
    ordering,
    terrainType,
    servicio,
    propertyType,
    acceptsFinancing,
    hasWater,
    hasElectricity,
    hasDrainage,
    hasPavedRoad,
  } = filters;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${triggerClassName ?? ""}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Mas filtros
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Mas filtros</DrawerTitle>
          <DrawerDescription>Refina tu busqueda de terrenos</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-20">
          {/* Ordenamiento */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Ordenar por</label>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ ordering: ordering === option.value ? "" : option.value })
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    ordering === option.value
                      ? "bg-ink text-white shadow-sm"
                      : "border border-line/60 bg-white text-text-muted hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servicios del terreno */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Servicios</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {TERRAIN_SERVICES.map((service) => (
                <CheckRow
                  key={service.key}
                  label={service.label}
                  checked={filters[service.key]}
                  onToggle={() =>
                    onFiltersChange({ [service.key]: !filters[service.key] } as Partial<FilterValues>)
                  }
                />
              ))}
            </div>
          </div>

          {/* Tipo de propiedad / documentacion */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Tipo de propiedad</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ propertyType: propertyType === option.value ? "" : option.value })
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    propertyType === option.value
                      ? "bg-primary text-white shadow-sm"
                      : "border border-line/60 bg-white text-text-muted hover:border-primary/30 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Facilidades de pago */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Pago</label>
            <CheckRow
              label="Acepta facilidades de pago"
              checked={acceptsFinancing}
              onToggle={() => onFiltersChange({ acceptsFinancing: !acceptsFinancing })}
            />
          </div>

          {/* Tipo de terreno (filtro existente) */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Tipo de terreno</label>
            <div className="flex flex-wrap gap-2">
              {TERRAIN_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ terrainType: terrainType === type.value ? "" : type.value })
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    terrainType === type.value
                      ? "bg-primary text-white shadow-sm"
                      : "border border-line/60 bg-white text-text-muted hover:border-primary/30 hover:text-ink"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servicios cercanos (filtro existente) */}
          <div>
            <label className="mb-3 block text-sm font-bold text-ink">Servicios cercanos</label>
            <div className="flex flex-wrap gap-2">
              {NEARBY_SERVICES.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => onFiltersChange({ servicio: servicio === service ? "" : service })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    servicio === service
                      ? "bg-cta text-text shadow-sm"
                      : "border border-line/60 bg-white text-text-muted hover:border-cta/30 hover:text-ink"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <DrawerClose asChild>
            <button
              type="button"
              className="w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white transition hover:bg-ink/90"
            >
              Aplicar filtros
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
