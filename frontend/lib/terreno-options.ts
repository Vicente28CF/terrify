// Vocabulario compartido entre el formulario de publicar y los filtros de busqueda.
// Los valores deben coincidir exactamente con lo que el backend espera/compara
// (choices de land_use/property_type, y strings literales en nearby_services/terrain_type).

export type TerrenoOption = { value: string; label: string };

export const LAND_USE_VALUES: TerrenoOption[] = [
  { value: "residential", label: "Habitacional" },
  { value: "commercial", label: "Comercial" },
  { value: "agricultural", label: "Agricola" },
  { value: "industrial", label: "Industrial" },
];

export const PROPERTY_TYPE_VALUES: TerrenoOption[] = [
  { value: "titled", label: "Escriturado" },
  { value: "deed_pending", label: "En proceso de escritura" },
  { value: "ejido", label: "Ejidal" },
  { value: "other", label: "Otro" },
];

export const TERRAIN_TYPE_VALUES: TerrenoOption[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
  { value: "rural", label: "Rural" },
  { value: "urbano", label: "Urbano" },
];

export const NEARBY_SERVICE_VALUES: TerrenoOption[] = [
  { value: "Agua", label: "Agua" },
  { value: "Luz", label: "Luz" },
  { value: "Gas", label: "Gas" },
  { value: "Drenaje", label: "Drenaje" },
  { value: "Pavimento", label: "Pavimento" },
  { value: "Internet", label: "Internet" },
  { value: "Seguridad", label: "Seguridad" },
  { value: "Transporte público", label: "Transporte público" },
];

export const TERRAIN_SERVICE_TOGGLES = [
  { key: "hasWater", label: "Agua" },
  { key: "hasElectricity", label: "Luz" },
  { key: "hasDrainage", label: "Drenaje" },
  { key: "hasPavedRoad", label: "Calle pavimentada" },
] as const;
