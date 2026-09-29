import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { ImageGallery } from "@/components/image-gallery";
import { ContactFormPanel } from "@/components/contact-form-panel";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { ShareButton } from "@/components/share-button";
import { fetchTerrenoBySlug } from "@/lib/api";
import type { Terreno } from "@/lib/types";

type TerrenoDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TerrenoDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const terreno = await fetchTerrenoBySlug(slug);
    return {
      title: `${terreno.title} en ${terreno.municipio}`,
      description: terreno.shortDescription,
      openGraph: {
        title: `${terreno.title} — Terrify`,
        description: terreno.shortDescription,
        url: `https://terrify.mx/terrenos/${terreno.slug}`,
        images: terreno.image ? [{ url: terreno.image, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${terreno.title} — Terrify`,
        description: terreno.shortDescription,
        images: terreno.image ? [terreno.image] : [],
      },
    };
  } catch {
    return { title: "Terreno | Terrify" };
  }
}



function BackButton() {
  return (
    <Link
      href="/"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white"
      aria-label="Volver"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}

function HeaderActions({ title }: { title: string }) {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between p-4 lg:absolute lg:p-6">
      <BackButton />
      <div className="flex items-center gap-2">
        <ShareButton title={title} />
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "dark";
}) {
  if (variant === "dark") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-gray-400">{label}</span>
          <span className="text-sm font-semibold">{value}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-background-alt px-4 py-3">
      <span className="block text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

function TitleAndPrice({ terreno }: { terreno: Terreno }) {
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl font-bold leading-tight text-text lg:text-4xl">
          {terreno.title}
        </h1>
        <div className="text-right shrink-0">
          <p className="font-display text-xl font-bold text-cta">{terreno.priceLabel}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Pesos Mexicanos</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-sm">
          {terreno.municipio}, {terreno.estado}
        </span>
      </div>
    </div>
  );
}

function DescriptionSection({ description }: { description: string }) {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">Descripción</h2>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </section>
  );
}

function LocationSection({
  municipio,
  estado,
  address,
  latitude,
  longitude,
}: {
  municipio: string;
  estado: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapQuery = hasCoordinates
    ? `${latitude},${longitude}`
    : encodeURIComponent(`${municipio}, ${estado}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <section className="border-t border-line py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text">Ubicación</h2>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-cta transition hover:underline"
        >
          Ver en Mapas
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>

      {hasCoordinates ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2smx!4v1`}
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="bg-background-alt"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-background-alt p-6 text-center">
          <p className="mb-2 text-sm text-text-muted">
            {municipio}, {estado}
          </p>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-cta hover:underline"
          >
            Ver ubicación aproximada en Google Maps
          </a>
        </div>
      )}

      {address && (
        <p className="mt-3 text-sm text-text-muted">
          <span className="font-medium text-text">Dirección:</span> {address}
        </p>
      )}
    </section>
  );
}

function SellerCard({ owner }: { owner: { fullName: string; isVerified: boolean } | null }) {
  if (!owner) return null;

  const initials = owner.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">Información del vendedor</h2>
      <div className="flex items-center gap-3 rounded-xl border border-line p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cta text-white font-semibold">
          {initials}
        </div>
        <div>
          <p className="font-medium text-text">{owner.fullName}</p>
          {owner.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Vendedor verificado
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function TerrenoDetailPage({ params }: TerrenoDetailPageProps) {
  const { slug } = await params;

  let terreno: Terreno | null = null;
  try {
    terreno = await fetchTerrenoBySlug(slug);
  } catch {
    // Error de red o backend no disponible — mostrar página amigable
  }

  if (!terreno) {
    notFound();
  }

  return (
    <div>
      <HeaderActions title={terreno.title} />

      {/* Hero Gallery */}
      <ImageGallery images={terreno.images} title={terreno.title} />

      {/* Main Content */}
      <main className="relative z-10 -mt-6 rounded-t-3xl bg-white px-5 pt-6 lg:mx-auto lg:max-w-7xl lg:rounded-t-none lg:bg-transparent lg:px-8 lg:pt-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left Column - Content */}
          <div className="lg:rounded-3xl lg:bg-white lg:p-8">
            {/* Title & Price */}
            <TitleAndPrice terreno={terreno} />

            {/* Info Chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              <InfoChip label="Superficie" value={terreno.areaLabel} />
              <InfoChip label="Estatus" value={terreno.status === "active" ? "Activo" : terreno.status === "sold" ? "Vendido" : "Pausado"} variant="dark" />
            </div>

            {/* Description */}
            <DescriptionSection description={terreno.description} />

            {/* Location */}
            <LocationSection
              municipio={terreno.municipio}
              estado={terreno.estado}
              address={terreno.address}
              latitude={terreno.latitude}
              longitude={terreno.longitude}
            />

            {/* Seller */}
            <SellerCard owner={terreno.owner} />

            {/* Spacer for mobile bottom bar */}
            <div className="h-20 lg:hidden" />
          </div>

          {/* Right Column - Sidebar (Desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-8 rounded-2xl border border-line bg-white p-6 shadow-lg">
              <div className="mb-4 border-b border-line pb-4">
                <p className="font-display text-2xl font-bold text-cta">{terreno.priceLabel}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">Pesos Mexicanos</p>
              </div>
              <ContactFormPanel 
                terrenoSlug={terreno.slug} 
                terrenoTitle={terreno.title} 
                ownerEmail={terreno.owner?.email}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Contact Bar */}
      <MobileContactBar 
        terrenoSlug={terreno.slug} 
        terrenoTitle={terreno.title}
        ownerEmail={terreno.owner?.email}
      />
    </div>
  );
}
