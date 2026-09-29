// lib/api.ts — capa de acceso a la API REST del backend

import type {
  AuthSession,
  AuthUser,
  ContactRequest,
  ContactRequestPayload,
  CreateTerrenoPayload,
  Message,
  Terreno,
  TerrenoImageInput,
  UpdateTerrenoPayload,
} from "@/lib/types";

let refreshPromise: Promise<AuthSession | null> | null = null;

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type TerrenoListApi = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  municipio: string;
  estado: string;
  area_m2: string;
  area_unit?: "m2" | "hectare";
  price: string;
  price_per_m2: number | null;
  status: "active" | "paused" | "sold";
  is_featured: boolean;
  image: string | null;
  is_favorited?: boolean;
  terrain_type?: string;
  land_use?: string;
  property_type?: string;
  has_water?: boolean;
  has_electricity?: boolean;
  has_drainage?: boolean;
  has_paved_road?: boolean;
  accepts_financing?: boolean;
  down_payment_amount?: string | null;
  payment_facility_label?: string | null;
  es_accesible_para_empezar?: boolean;
  nearby_services?: string[];
  latitude?: string | null;
  longitude?: string | null;
  created_at?: string;
};

type TerrenoDetailApi = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  price_per_m2: number | null;
  area_m2: string;
  area_unit?: "m2" | "hectare";
  municipio: string;
  estado: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
  is_featured: boolean;
  views_count: number;
  is_favorited?: boolean;
  nearby_services?: string[];
  terrain_type?: string;
  land_use?: string;
  property_type?: string;
  has_water?: boolean;
  has_electricity?: boolean;
  has_drainage?: boolean;
  has_paved_road?: boolean;
  accepts_financing?: boolean;
  down_payment_amount?: string | null;
  payment_facility_label?: string | null;
  es_accesible_para_empezar?: boolean;
  images: Array<{
    id: string;
    image_url: string;
    order: number;
    is_cover: boolean;
  }>;
  owner: {
    full_name: string;
    is_verified: boolean;
    email?: string;
  };
  created_at: string;
  updated_at: string;
};

type AuthUserApi = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
};

type ContactRequestApi = {
  id: string;
  terreno: {
    title: string;
    slug: string;
  };
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  status: "pending" | "read" | "replied";
  notification_status: "pending" | "sent" | "failed";
  notification_sent_at: string | null;
  notification_error: string;
  created_at: string;
  messages: MessageApi[];
  last_message: { body: string; created_at: string } | null;
};

type MessageApi = {
  id: string;
  sender_role: "buyer" | "seller";
  sender_name: string;
  body: string;
  is_flagged: boolean;
  created_at: string;
  is_mine: boolean;
};

type LoginResponse = {
  user: AuthUserApi;
  tokens: {
    access: string;
    refresh: string;
  };
  non_field_errors?: string[];
  detail?: string;
};

type RefreshResponse = {
  access: string;
  refresh?: string;
  detail?: string;
};

type ApiErrorLike = {
  detail?: string;
  non_field_errors?: unknown;
  [key: string]: unknown;
};

export type AuthRequestOptions = {
  accessToken: string;
  refreshToken: string;
  onSessionUpdate?: (session: AuthSession) => void;
  onUnauthorized?: () => void;
  onRefreshStart?: () => void;
  onRefreshSuccess?: () => void;
  onRefreshFailure?: () => void;
};

export type ContactFilters = {
  status?: ContactRequest["status"] | "all";
  notificationStatus?: ContactRequest["notificationStatus"] | "all";
  search?: string;
  page?: number;
};

export type ContactListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ContactRequest[];
};

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getApiBaseUrl() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000/api";

  return rawBaseUrl.endsWith("/api")
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/$/, "")}/api`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatArea(value: number, unit?: string) {
  const isHectare = unit === "hectare";
  const converted = isHectare ? value / 10000 : value;
  const formatted = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: converted % 1 === 0 ? 0 : 2,
  }).format(converted);
  return isHectare ? `${formatted} ha` : `${formatted} m2`;
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapAuthUser(item: AuthUserApi): AuthUser {
  return {
    id: item.id,
    email: item.email,
    fullName: item.full_name,
    phone: item.phone,
    role: item.role,
    isVerified: item.is_verified,
    canPublish: item.can_publish,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapTerrenoList(item: TerrenoListApi): Terreno {
  const price = toNumber(item.price) ?? 0;
  const areaM2 = toNumber(item.area_m2) ?? 0;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    shortDescription: item.short_description,
    description: item.short_description,
    municipio: item.municipio,
    estado: item.estado,
    areaM2,
    areaLabel: formatArea(areaM2, item.area_unit),
    price,
    priceLabel: formatCurrency(price),
    pricePerM2: item.price_per_m2 ?? null,
    status: item.status,
    isFeatured: item.is_featured,
    image: item.image,
    images: [],
    viewsCount: 0,
    address: "",
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    owner: null,
    createdAt: item.created_at ?? null,
    updatedAt: null,
    isFavorited: item.is_favorited ?? false,
    terrainType: item.terrain_type,
    areaUnit: item.area_unit ?? "m2",
    landUse: item.land_use ?? "",
    propertyType: item.property_type ?? "",
    hasWater: item.has_water ?? false,
    hasElectricity: item.has_electricity ?? false,
    hasDrainage: item.has_drainage ?? false,
    hasPavedRoad: item.has_paved_road ?? false,
    acceptsFinancing: item.accepts_financing ?? false,
    downPaymentAmount: toNumber(item.down_payment_amount),
    paymentFacilityLabel: item.payment_facility_label ?? null,
    esAccesibleParaEmpezar: item.es_accesible_para_empezar,
    nearbyServices: item.nearby_services,
  };
}

function mapTerrenoDetail(item: TerrenoDetailApi): Terreno {
  const price = toNumber(item.price) ?? 0;
  const areaM2 = toNumber(item.area_m2) ?? 0;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    shortDescription: item.description.slice(0, 140).trim(),
    description: item.description,
    municipio: item.municipio,
    estado: item.estado,
    areaM2,
    areaLabel: formatArea(areaM2, item.area_unit),
    price,
    priceLabel: formatCurrency(price),
    pricePerM2: item.price_per_m2 ?? null,
    status: item.status as "active" | "paused" | "sold",
    isFeatured: item.is_featured,
    image: item.images.find((image) => image.is_cover)?.image_url ?? item.images[0]?.image_url ?? null,
    images: item.images.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      order: image.order,
      isCover: image.is_cover,
    })),
    viewsCount: item.views_count,
    address: item.address,
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    owner: {
      fullName: item.owner.full_name,
      isVerified: item.owner.is_verified,
      email: item.owner.email,
    },
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    nearbyServices: item.nearby_services ?? [],
    terrainType: item.terrain_type,
    areaUnit: item.area_unit ?? "m2",
    landUse: item.land_use ?? "",
    propertyType: item.property_type ?? "",
    hasWater: item.has_water ?? false,
    hasElectricity: item.has_electricity ?? false,
    hasDrainage: item.has_drainage ?? false,
    hasPavedRoad: item.has_paved_road ?? false,
    acceptsFinancing: item.accepts_financing ?? false,
    downPaymentAmount: toNumber(item.down_payment_amount),
    paymentFacilityLabel: item.payment_facility_label ?? null,
    esAccesibleParaEmpezar: item.es_accesible_para_empezar,
  };
}

// ─── Mapeo de mensajes ──────────────────────────────────────────────────────

function mapMessage(item: MessageApi): Message {
  return {
    id: item.id,
    senderRole: item.sender_role,
    senderName: item.sender_name,
    body: item.body,
    isFlagged: item.is_flagged,
    createdAt: item.created_at,
    isMine: item.is_mine,
  };
}

function mapContactRequest(item: ContactRequestApi): ContactRequest {
  return {
    id: item.id,
    terreno: item.terreno,
    buyerName: item.buyer_name,
    buyerEmail: item.buyer_email,
    buyerPhone: item.buyer_phone,
    message: item.message,
    status: item.status,
    notificationStatus: item.notification_status,
    notificationSentAt: item.notification_sent_at,
    notificationError: item.notification_error,
    createdAt: item.created_at,
    messages: item.messages?.map(mapMessage) ?? [],
    lastMessage: item.last_message
      ? { body: item.last_message.body, createdAt: item.last_message.created_at }
      : null,
  };
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

function pickFirstMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = pickFirstMessage(item);
      if (message) return message;
    }
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = pickFirstMessage(item);
      if (message) return message;
    }
  }

  return undefined;
}

function getErrorMessage(
  data: unknown,
  fallbackMessage: string,
  preferredKeys: string[] = [],
) {
  if (data && typeof data === "object") {
    const errorData = data as ApiErrorLike;

    for (const key of preferredKeys) {
      const preferredMessage = pickFirstMessage(errorData[key]);
      if (preferredMessage) {
        return preferredMessage;
      }
    }

    const commonMessage =
      pickFirstMessage(errorData.non_field_errors) ??
      pickFirstMessage(errorData.detail);

    if (commonMessage) {
      return commonMessage;
    }
  }

  return pickFirstMessage(data) ?? fallbackMessage;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  {
    next,
    fallbackMessage,
    preferredErrorKeys = [],
  }: {
    next?: { revalidate: number };
    fallbackMessage: string;
    preferredErrorKeys?: string[];
  },
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${await getApiBaseUrl()}${path}`, {
      ...init,
      ...(next ? { next } : {}),
    });
  } catch (error) {
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa que el backend este encendido.",
      0,
      error,
    );
  }

  const data = await readJsonResponse<T>(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, fallbackMessage, preferredErrorKeys),
      response.status,
      data,
    );
  }

  return data as T;
}

async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const data = await requestJson<AuthUserApi>(
    "/users/me/",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
    {
      fallbackMessage: "No se pudo recuperar la sesion actual.",
    },
  );
  return mapAuthUser(data);
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const data = await requestJson<LoginResponse>(
    "/auth/login/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    },
    {
      fallbackMessage: "No se pudo iniciar sesion.",
    },
  );

  return {
    accessToken: data.tokens.access,
    refreshToken: data.tokens.refresh,
    user: mapAuthUser(data.user),
  };
}

export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ message: string; email: string }> {
  const response = await requestJson<{ message: string; email: string }>(
    "/auth/register/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      }),
    },
    {
      fallbackMessage: "No se pudo crear la cuenta.",
      preferredErrorKeys: ["email", "password", "full_name", "non_field_errors"],
    },
  );

  return response;
}

export async function loginWithGoogle(credential: string): Promise<AuthSession> {
  const data = await requestJson<LoginResponse>(
    "/auth/google/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    },
    {
      fallbackMessage: "No se pudo iniciar sesion con Google.",
    },
  );

  return {
    accessToken: data.tokens.access,
    refreshToken: data.tokens.refresh,
    user: mapAuthUser(data.user),
  };
}

export async function refreshAuthSession(refreshToken: string): Promise<AuthSession | null> {
  try {
    const refreshData = await requestJson<RefreshResponse>(
      "/auth/token/refresh/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      },
      {
        fallbackMessage: "No se pudo refrescar la sesion.",
      },
    );

    const nextRefreshToken = refreshData.refresh ?? refreshToken;
    const user = await fetchCurrentUser(refreshData.access);

    return {
      accessToken: refreshData.access,
      refreshToken: nextRefreshToken,
      user,
    };
  } catch {
    return null;
  }
}

export async function logoutAuthSession(session: AuthSession): Promise<void> {
  try {
    await fetch(`${await getApiBaseUrl()}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refresh: session.refreshToken }),
    });
  } catch {
    // Logout local siempre debe continuar aunque falle el backend.
  }
}

async function requestAuthenticatedJson<T>(
  path: string,
  auth: AuthRequestOptions,
  init: RequestInit,
  {
    fallbackMessage,
    preferredErrorKeys = [],
  }: {
    fallbackMessage: string;
    preferredErrorKeys?: string[];
  },
): Promise<T> {
  let currentAccessToken = auth.accessToken;
  let currentRefreshToken = auth.refreshToken;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${currentAccessToken}`);

    let response: Response;

    try {
      response = await fetch(`${await getApiBaseUrl()}${path}`, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
      });
    } catch (error) {
      throw new ApiError(
        "No se pudo conectar con el servidor. Revisa que el backend este encendido.",
        0,
        error,
      );
    }

    const data = await readJsonResponse<T>(response);

    if (response.ok) {
      return data as T;
    }

    if (response.status === 401 && attempt === 0) {
      auth.onRefreshStart?.();

      if (!refreshPromise) {
        refreshPromise = refreshAuthSession(currentRefreshToken).finally(() => {
          refreshPromise = null;
        });
      }

      const refreshedSession = await refreshPromise;

      if (!refreshedSession) {
        auth.onRefreshFailure?.();
        auth.onUnauthorized?.();
        throw new ApiError("Tu sesion expiro. Vuelve a iniciar sesion.", 401, data);
      }

      currentAccessToken = refreshedSession.accessToken;
      currentRefreshToken = refreshedSession.refreshToken;
      auth.onSessionUpdate?.(refreshedSession);
      auth.onRefreshSuccess?.();
      continue;
    }

    throw new ApiError(
      getErrorMessage(data, fallbackMessage, preferredErrorKeys),
      response.status,
      data,
    );
  }

  throw new ApiError(fallbackMessage, 500, null);
}

export type TerrenoFilters = {
  municipio?: string;
  precio_min?: number;
  precio_max?: number;
  min_area?: number;
  max_area?: number;
  area_unit?: "m2" | "hectare";
  ordering?: string;
  is_featured?: boolean;
  search?: string;
  terrain_type?: string;
  servicio?: string;
  land_use?: string;
  property_type?: string;
  has_water?: boolean;
  has_electricity?: boolean;
  has_drainage?: boolean;
  has_paved_road?: boolean;
  accepts_financing?: boolean;
  accesible_para_empezar?: boolean;
};

function mapTerrenoOrdering(ordering?: string) {
  if (!ordering) return undefined;
  const map: Record<string, string> = {
    precio_asc: "price",
    precio_desc: "-price",
    recientes: "-created_at",
    area_asc: "area_m2",
    area_desc: "-area_m2",
    precio_m2_asc: "price_per_m2",
  };
  return map[ordering] ?? ordering;
}

export async function fetchTerrenos(page = 1, filters: TerrenoFilters = {}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.municipio) {
    params.set("municipio", filters.municipio);
  }

  if (filters.precio_min !== undefined && filters.precio_min !== null) {
    params.set("min_price", String(filters.precio_min));
  }

  if (filters.precio_max !== undefined && filters.precio_max !== null) {
    params.set("max_price", String(filters.precio_max));
  }

  if (filters.min_area !== undefined && filters.min_area !== null) {
    params.set("min_area", String(filters.min_area));
  }

  if (filters.max_area !== undefined && filters.max_area !== null) {
    params.set("max_area", String(filters.max_area));
  }

  if (filters.area_unit) {
    params.set("area_unit", filters.area_unit);
  }

  const mappedOrdering = mapTerrenoOrdering(filters.ordering);
  if (mappedOrdering) {
    params.set("ordering", mappedOrdering);
  }

  if (filters.is_featured !== undefined && filters.is_featured !== null) {
    params.set("is_featured", String(filters.is_featured));
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.terrain_type) {
    params.set("terrain_type", filters.terrain_type);
  }

  if (filters.land_use) {
    params.set("land_use", filters.land_use);
  }

  if (filters.property_type) {
    params.set("property_type", filters.property_type);
  }

  if (filters.has_water !== undefined) {
    params.set("has_water", String(filters.has_water));
  }

  if (filters.has_electricity !== undefined) {
    params.set("has_electricity", String(filters.has_electricity));
  }

  if (filters.has_drainage !== undefined) {
    params.set("has_drainage", String(filters.has_drainage));
  }

  if (filters.has_paved_road !== undefined) {
    params.set("has_paved_road", String(filters.has_paved_road));
  }

  if (filters.accepts_financing !== undefined) {
    params.set("accepts_financing", String(filters.accepts_financing));
  }

  if (filters.servicio) {
    params.set("servicio", filters.servicio);
  }

  if (filters.accesible_para_empezar !== undefined) {
    params.set("accesible_para_empezar", String(filters.accesible_para_empezar));
  }

  const queryString = params.toString();
  const path = queryString
    ? `/terrenos/?${queryString}`
    : "/terrenos/";

  const response = await requestJson<PaginatedResponse<TerrenoListApi>>(
    path,
    {},
    {
      next: { revalidate: 30 },
      fallbackMessage: "No se pudieron cargar los terrenos.",
    },
  );

  return {
    ...response,
    results: response.results.map(mapTerrenoList),
  };
}

export async function fetchTerrenoBySlug(slug: string) {
  const response = await requestJson<TerrenoDetailApi>(
    `/terrenos/${slug}/`,
    {},
    {
      next: { revalidate: 30 },
      fallbackMessage: "No se pudo cargar el terreno.",
    },
  );

  return mapTerrenoDetail(response);
}

export async function createContactRequest(payload: ContactRequestPayload, auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<ContactRequestApi>(
    "/contact-requests/",
    auth,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        terreno_slug: payload.terrenoSlug,
        buyer_name: payload.buyerName,
        buyer_email: payload.buyerEmail,
        buyer_phone: payload.buyerPhone,
        message: payload.message,
      }),
    },
    {
      fallbackMessage: "No se pudo enviar la solicitud de contacto.",
      preferredErrorKeys: ["message"],
    },
  );

  return mapContactRequest(response);
}

export async function fetchMyTerrenos(auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<PaginatedResponse<TerrenoListApi>>(
    "/terrenos/mine/",
    auth,
    {
      method: "GET",
    },
    {
      fallbackMessage: "No se pudieron cargar tus terrenos.",
    },
  );

  return response.results.map(mapTerrenoList);
}

export async function fetchReceivedContacts(auth: AuthRequestOptions) {
  return fetchReceivedContactsWithFilters(auth);
}

export async function fetchMyConversations(auth: AuthRequestOptions): Promise<ContactRequest[]> {
  const response = await requestAuthenticatedJson<PaginatedResponse<ContactRequestApi>>(
    "/contact-requests/mine/",
    auth,
    { method: "GET" },
    { fallbackMessage: "No se pudieron cargar las conversaciones." },
  );
  return response.results.map(mapContactRequest);
}

export async function fetchUnreadConversationsCount(auth: AuthRequestOptions): Promise<number> {
  const response = await requestAuthenticatedJson<{ count: number }>(
    "/contact-requests/unread-count/",
    auth,
    { method: "GET" },
    { fallbackMessage: "No se pudo cargar el conteo." },
  );
  return response.count;
}

export async function markConversationAsRead(
  auth: AuthRequestOptions,
  contactId: string,
): Promise<ContactRequest> {
  const response = await requestAuthenticatedJson<ContactRequestApi>(
    `/contact-requests/${contactId}/mark-read/`,
    auth,
    { method: "POST" },
    { fallbackMessage: "No se pudo marcar como leído." },
  );
  return mapContactRequest(response);
}

export async function fetchReceivedContactsWithFilters(
  auth: AuthRequestOptions,
  filters: ContactFilters = {},
): Promise<ContactListResponse> {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.notificationStatus && filters.notificationStatus !== "all") {
    params.set("notification_status", filters.notificationStatus);
  }

  const trimmedSearch = filters.search?.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const path = params.toString()
    ? `/contact-requests/?${params.toString()}`
    : "/contact-requests/";

  const response = await requestAuthenticatedJson<PaginatedResponse<ContactRequestApi>>(
    path,
    auth,
    {
      method: "GET",
    },
    {
      fallbackMessage: "No se pudieron cargar los contactos.",
    },
  );

  return {
    count: response.count,
    next: response.next,
    previous: response.previous,
    results: response.results.map(mapContactRequest),
  };
}

export async function resendContactRequestEmail(id: string, auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<ContactRequestApi>(
    `/contact-requests/${id}/resend-email/`,
    auth,
    {
      method: "POST",
    },
    {
      fallbackMessage: "No se pudo reenviar la notificacion del contacto.",
    },
  );

  return mapContactRequest(response);
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactRequest["status"],
  auth: AuthRequestOptions,
) {
  const response = await requestAuthenticatedJson<ContactRequestApi>(
    `/contact-requests/${id}/`,
    auth,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
    {
      fallbackMessage: "No se pudo actualizar el estado del contacto.",
      preferredErrorKeys: ["status"],
    },
  );

  return mapContactRequest(response);
}

export async function createTerreno(payload: CreateTerrenoPayload, auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    "/terrenos/",
    auth,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        area_m2: payload.areaM2,
        municipio: payload.municipio,
        estado: payload.estado,
        address: payload.address ?? "",
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        status: payload.status,
        nearby_services: payload.nearbyServices ?? [],
        terrain_type: payload.terrainType ?? "",
        land_use: payload.landUse ?? undefined,
        property_type: payload.propertyType ?? undefined,
        has_water: payload.hasWater ?? undefined,
        has_electricity: payload.hasElectricity ?? undefined,
        has_drainage: payload.hasDrainage ?? undefined,
        has_paved_road: payload.hasPavedRoad ?? undefined,
        accepts_financing: payload.acceptsFinancing ?? false,
        down_payment_amount: payload.downPaymentAmount ?? undefined,
        area_unit: payload.areaUnit ?? undefined,
      }),
    },
    {
      fallbackMessage: "No se pudo crear el terreno.",
    },
  );

  return mapTerrenoDetail(response);
}

export async function fetchOwnedTerrenoBySlug(slug: string, auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/`,
    auth,
    {
      method: "GET",
    },
    {
      fallbackMessage: "No se pudo cargar el terreno.",
    },
  );

  return mapTerrenoDetail(response);
}

export async function updateTerreno(
  slug: string,
  payload: UpdateTerrenoPayload,
  auth: AuthRequestOptions,
) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/`,
    auth,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        area_m2: payload.areaM2,
        municipio: payload.municipio,
        estado: payload.estado,
        address: payload.address ?? "",
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        status: payload.status,
        nearby_services: payload.nearbyServices ?? [],
        terrain_type: payload.terrainType ?? "",
        land_use: payload.landUse ?? undefined,
        property_type: payload.propertyType ?? undefined,
        has_water: payload.hasWater ?? undefined,
        has_electricity: payload.hasElectricity ?? undefined,
        has_drainage: payload.hasDrainage ?? undefined,
        has_paved_road: payload.hasPavedRoad ?? undefined,
        accepts_financing: payload.acceptsFinancing ?? false,
        down_payment_amount: payload.downPaymentAmount ?? undefined,
        area_unit: payload.areaUnit ?? undefined,
      }),
    },
    {
      fallbackMessage: "No se pudo actualizar el terreno.",
    },
  );

  return mapTerrenoDetail(response);
}

export async function updateTerrenoImages(
  slug: string,
  images: TerrenoImageInput[],
  auth: AuthRequestOptions,
) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/images/`,
    auth,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: images.map((image) => ({
          cloudinary_url: image.cloudinaryUrl,
          cloudinary_id: image.cloudinaryId,
          order: image.order,
          is_cover: image.isCover,
        })),
      }),
    },
    {
      fallbackMessage: "No se pudieron guardar las imagenes.",
    },
  );

  return mapTerrenoDetail(response);
}

export async function manageTerrenoImages(
  slug: string,
  images: Array<{ id: string; order: number; isCover: boolean }>,
  auth: AuthRequestOptions,
) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/images/manage/`,
    auth,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: images.map((image) => ({
          id: image.id,
          order: image.order,
          is_cover: image.isCover,
        })),
      }),
    },
    {
      fallbackMessage: "No se pudo actualizar la galeria del terreno.",
      preferredErrorKeys: ["images"],
    },
  );

  return mapTerrenoDetail(response);
}

export async function toggleFavorite(slug: string, isFavorited: boolean, auth: AuthRequestOptions) {
  await requestAuthenticatedJson(
    `/terrenos/${slug}/favorite/`,
    auth,
    { method: isFavorited ? "DELETE" : "POST" },
    { fallbackMessage: "No se pudo actualizar el guardado en favoritos." }
  );
}

export async function fetchFavorites(auth: AuthRequestOptions) {
  const response = await requestAuthenticatedJson<PaginatedResponse<TerrenoListApi>>(
    "/terrenos/favorites/",
    auth,
    { method: "GET" },
    { fallbackMessage: "No se pudieron cargar los favoritos." },
  );

  return response.results.map(mapTerrenoList);
}

export async function deleteTerrenoImage(
  slug: string,
  imageId: string,
  auth: AuthRequestOptions,
) {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/images/manage/`,
    auth,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_id: imageId }),
    },
    {
      fallbackMessage: "No se pudo eliminar la imagen.",
      preferredErrorKeys: ["image_id"],
    },
  );

  return mapTerrenoDetail(response);
}

export async function uploadTerrenoImages(
  slug: string,
  files: File[],
  auth: AuthRequestOptions,
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/upload-images/`,
    auth,
    {
      method: "POST",
      body: formData,
    },
    {
      fallbackMessage: "No se pudieron subir las imagenes.",
      preferredErrorKeys: ["images"],
    },
  );

  return mapTerrenoDetail(response);
}

// ─── Mensajes ───────────────────────────────────────────────────────────────

export async function fetchMessages(
  contactId: string,
  auth: AuthRequestOptions,
): Promise<Message[]> {
  const response = await requestAuthenticatedJson<PaginatedResponse<MessageApi>>(
    `/contact-requests/${contactId}/messages/`,
    auth,
    { method: "GET" },
    { fallbackMessage: "No se pudieron cargar los mensajes." },
  );
  return response.results.map(mapMessage);
}

export async function sendMessage(
  contactId: string,
  body: string,
  auth: AuthRequestOptions,
): Promise<Message> {
  const response = await requestAuthenticatedJson<MessageApi>(
    `/contact-requests/${contactId}/messages/`,
    auth,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
    { fallbackMessage: "No se pudo enviar el mensaje." },
  );
  return mapMessage(response);
}

export async function setTerrenoStatus(
  slug: string,
  status: "active" | "sold" | "paused",
  auth: AuthRequestOptions,
): Promise<Terreno> {
  const response = await requestAuthenticatedJson<TerrenoDetailApi>(
    `/terrenos/${slug}/set_status/`,
    auth,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    { fallbackMessage: "No se pudo actualizar el estado." },
  );
  return mapTerrenoDetail(response);
}

export async function deleteTerreno(
  slug: string,
  auth: AuthRequestOptions,
): Promise<void> {
  await requestAuthenticatedJson<null>(
    `/terrenos/${slug}/`,
    auth,
    { method: "DELETE" },
    { fallbackMessage: "No se pudo eliminar el terreno." },
  );
}
