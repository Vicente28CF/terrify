"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { toggleFavorite } from "@/lib/api";
import type { Terreno } from "@/lib/types";

const PlaceholderImage = () => (
  <div className="flex h-full w-full items-center justify-center bg-stone/10">
    <svg className="h-12 w-12 text-stone/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
    </svg>
  </div>
);

export function TerrainCard({ terreno }: { terreno: Terreno }) {
  const { isAuthenticated, session } = useAuth();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(terreno.isFavorited ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFavoriteClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !session?.accessToken) {
      router.push(`/login?redirect=/terrenos/${terreno.slug}`);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const newStatus = !isFavorited;
    setIsFavorited(newStatus);
    try {
      await toggleFavorite(terreno.slug, isFavorited, {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } catch {
      setIsFavorited(!newStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const financingLabel =
    terreno.paymentFacilityLabel ?? "Financiamiento disponible";

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <Link href={`/terrenos/${terreno.slug}`} className="block outline-none">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone/10">
          {terreno.image ? (
            <Image
              src={terreno.image}
              alt={terreno.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <PlaceholderImage />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-4rem)] flex-col items-start gap-1.5">
            {terreno.isFeatured && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm">
                ⭐ Destacado
              </span>
            )}

            {terreno.esAccesibleParaEmpezar && !terreno.isFeatured && (
              <span className="rounded-full bg-success px-3 py-1 text-xs font-bold text-white shadow-sm">
                Ideal para empezar
              </span>
            )}

            {terreno.acceptsFinancing && (
              <span className="max-w-full truncate rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white shadow-sm">
                {financingLabel}
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={handleFavoriteClick}
        disabled={isSubmitting}
        aria-label={isFavorited ? "Quitar de favoritos" : "Guardar"}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
      >
        <svg
          className={`h-6 w-6 drop-shadow-md transition-colors duration-200 ${
            isFavorited ? "text-danger" : "text-white"
          }`}
          viewBox="0 0 24 24"
          fill={isFavorited ? "currentColor" : "none"}
          stroke={isFavorited ? "none" : "white"}
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      <Link href={`/terrenos/${terreno.slug}`} className="block pt-3 pb-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink truncate">
            {terreno.municipio}{terreno.estado ? `, ${terreno.estado}` : ""}
          </p>
          {terreno.status === "active" && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
              Disponible
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm text-stone truncate">
          {terreno.areaLabel ?? "Superficie no especificada"}
        </p>

        <p className="mt-2 text-base font-bold text-ink">
          {terreno.priceLabel}
        </p>

        {terreno.pricePerM2 != null && terreno.pricePerM2 > 0 && (
          <p className="mt-0.5 text-xs text-stone">
            ${new Intl.NumberFormat("es-MX").format(terreno.pricePerM2)}/m²
          </p>
        )}
      </Link>
    </article>
  );
}
