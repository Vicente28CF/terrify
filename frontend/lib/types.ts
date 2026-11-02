export type TerrenoImage = {
  id: string;
  imageUrl: string;
  order: number;
  isCover: boolean;
};

export type TerrenoOwner = {
  fullName: string;
  isVerified: boolean;
  email?: string;
};

export type Terreno = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  municipio: string;
  estado: string;
  areaM2: number;
  areaLabel: string;
  price: number;
  priceLabel: string;
  pricePerM2: number | null;
  status: "active" | "paused" | "sold";
  isFeatured: boolean;
  image: string | null;
  images: TerrenoImage[];
  viewsCount: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  owner: TerrenoOwner | null;
  createdAt: string | null;
  updatedAt: string | null;
  isFavorited?: boolean;
  nearbyServices?: string[];
  terrainType?: string;
  areaUnit?: "m2" | "hectare";
  landUse?: string;
  propertyType?: string;
  hasWater?: boolean;
  hasElectricity?: boolean;
  hasDrainage?: boolean;
  hasPavedRoad?: boolean;
  acceptsFinancing?: boolean;
  downPaymentAmount?: number | null;
  paymentFacilityLabel?: string | null;
  esAccesibleParaEmpezar?: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  canPublish: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Message = {
  id: string;
  senderRole: "buyer" | "seller";
  senderName: string;
  body: string;
  isFlagged: boolean;
  createdAt: string;
  isMine: boolean;
};

export type ContactRequestPayload = {
  terrenoSlug: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message: string;
};

export type ContactRequest = {
  id: string;
  terreno: {
    title: string;
    slug: string;
  };
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  status: "pending" | "read" | "replied";
  notificationStatus: "pending" | "sent" | "failed";
  notificationSentAt: string | null;
  notificationError: string;
  createdAt: string;
  messages: Message[];
  lastMessage: { body: string; createdAt: string } | null;
};

export type SellerDashboardData = {
  terrenos: Terreno[];
  contacts: ContactRequest[];
};

export type CreateTerrenoPayload = {
  title: string;
  description: string;
  price: number;
  areaM2: number;
  municipio: string;
  estado: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: "active" | "paused" | "sold";
  nearbyServices?: string[];
  terrainType?: string;
  areaUnit?: "m2" | "hectare";
  landUse?: string;
  propertyType?: string;
  hasWater?: boolean;
  hasElectricity?: boolean;
  hasDrainage?: boolean;
  hasPavedRoad?: boolean;
  acceptsFinancing?: boolean;
  downPaymentAmount?: number | null;
};

export type UpdateTerrenoPayload = CreateTerrenoPayload;

export type TerrenoImageInput = {
  cloudinaryUrl: string;
  cloudinaryId: string;
  order: number;
  isCover: boolean;
};
