"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TerrainCard } from "@/components/terrain/TerrainCard";
import { useAuth } from "@/components/auth-provider";
import { fetchFavorites } from "@/lib/api";
import Link from "next/link";
import type { Terreno } from "@/lib/types";

export default function FavoritosPage() {
  const { isAuthenticated, session, isRestoring } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Terreno[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace("/login?redirect=/favoritos");
    }
  }, [isRestoring, isAuthenticated, router]);

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      if (!session) return;
      try {
        const data = await fetchFavorites({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        if (mounted) {
          setFavorites(data);
        }
      } catch {
        // Error silencioso — el estado inicial vacío es suficiente feedback
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (session) {
      loadFavorites();
    }
  }, [session]);

  if (isRestoring || (isAuthenticated && isLoading)) {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cta border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen relative bg-background selection:bg-cta/20 pb-24">
      <SiteHeader />

      {/* Decorative Orbs */}
      <div className="fixed inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-[100px] opacity-20" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-coral to-[#ffb88c] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Tus Favoritos
          </h1>
          <p className="mt-4 text-stone text-lg">
            Guarda los terrenos que más te interesen para revisarlos luego.
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {favorites.map((terreno) => (
              <TerrainCard key={terreno.id} terreno={terreno} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border border-line/50 bg-white/50 p-12 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cta/10 text-cta mb-6">
              <svg className="h-10 w-10 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-ink mb-3">Aún no tienes favoritos</h3>
            <p className="text-stone max-w-md mx-auto mb-8">
              Navega por nuestro catálogo y haz click en el corazón de los terrenos que te interesen para guardarlos aquí.
            </p>
            <Link
              href="/#listado"
              className="inline-flex items-center justify-center rounded-full bg-cta px-8 py-3.5 text-sm font-bold text-text transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              Explorar terrenos
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
